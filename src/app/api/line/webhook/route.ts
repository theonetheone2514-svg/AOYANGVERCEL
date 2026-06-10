import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'
import {
  replyMessage, pushMessage, pushToStore, textMessage,
  storeListFlex, menuFlex, cartFlex, helpMessage,
} from '@/lib/line'
import { DEFAULT_DELIVERY_FEE } from '@/lib/constants'
import { generateOtp, hashOtp } from '@/lib/auth'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { distanceKm, DEFAULT_LOCATION, MAX_DELIVERY_KM, findZoneId } from '@/lib/utils'

async function getUserState(lineUserId: string) {
  const { data } = await supabase
    .from('line_user_states').select('*').eq('line_user_id', lineUserId).single()
  return data || { line_user_id: lineUserId, current_store_id: null, cart: [] }
}

async function saveUserState(lineUserId: string, state: any) {
  await supabase.from('line_user_states').upsert(
    { ...state, line_user_id: lineUserId, updated_at: new Date().toISOString() },
    { onConflict: 'line_user_id' }
  )
}

async function findUserByLineId(lineUserId: string) {
  for (const table of ['customers', 'stores', 'riders'] as const) {
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('line_user_id', lineUserId)
      .single()
    if (data) return { type: table, ...data }
  }
  return null
}

export async function POST(request: Request) {
  const ip = getIp(request)
  const rl = await rateLimit(`webhook:${ip}`, { maxRequests: 60, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
  }

  const channelSecret = process.env.LINE_CHANNEL_SECRET
  if (!channelSecret) {
    console.error('[LINE] LINE_CHANNEL_SECRET is not configured — rejecting webhook for security')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const rawBody = await request.clone().text()
  const signature = request.headers.get('X-Line-Signature') || ''
  const expected = crypto
    .createHmac('SHA256', channelSecret)
    .update(rawBody)
    .digest('base64')
  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const events = body.events || []

  for (const event of events) {
    const replyToken = event.replyToken
    const lineUserId = event.source.userId

    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim()
      await handleTextMessage(text, replyToken, lineUserId)
    } else if (event.type === 'message' && event.message.type === 'location') {
      const { title, address, latitude, longitude } = event.message
      await handleLocationMessage(replyToken, lineUserId, latitude, longitude, title || address || '')
    }
  }

  return NextResponse.json({ success: true })
}

async function getDeliveryRadius(): Promise<number> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'radius')
    .single()
  return data?.value ? parseFloat(data.value) : MAX_DELIVERY_KM
}

async function handleLocationMessage(
  replyToken: string, lineUserId: string,
  lat: number, lng: number, address: string
) {
  const radius = await getDeliveryRadius()
  const dist = distanceKm(lat, lng, DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng)
  if (dist > radius) {
    return replyMessage(replyToken, [textMessage(
      `📍 พิกัดของคุณอยู่นอกรัศมีการจัดส่ง (สูงสุด ${radius} กม. จากบ้านสูงเนิน)\n\nกรุณาระบุที่อยู่ในเขตจัดส่ง`
    )])
  }

  const state = await getUserState(lineUserId)

  if (state.step === 'awaiting_address') {
    state.delivery_lat = lat
    state.delivery_lng = lng
    state.delivery_address = address || `(${lat.toFixed(4)}, ${lng.toFixed(4)})`
    state.step = 'confirm_address'
    await saveUserState(lineUserId, state)

    const cartTotal = (state.cart || []).reduce((s: number, c: any) => s + c.price * c.qty, 0)
    return replyMessage(replyToken, [textMessage(
      `📍 ที่อยู่จัดส่ง:\n${state.delivery_address}\n\n💵 ยอดรวม: ${cartTotal} บาท + ค่าส่ง ${DEFAULT_DELIVERY_FEE} บาท = ${cartTotal + DEFAULT_DELIVERY_FEE} บาท\n\nพิมพ์ "ยืนยัน" เพื่อสั่ง หรือ "ยกเลิก" เพื่อยกเลิก`
    )])
  }

  return replyMessage(replyToken, [textMessage('📍 ได้รับพิกัดแล้ว! พิมพ์ "สั่ง" เพื่อเริ่มสั่งอาหาร')])
}

async function placeOrder(
  replyToken: string, lineUserId: string, state: any,
  user: any, storeId: string, cart: any[]
) {
  let zoneId: string | null = null
  if (state.delivery_lat && state.delivery_lng) {
    const { data: zones } = await supabase.from('zones').select('id, lat, lng, radius')
    if (zones) zoneId = findZoneId(state.delivery_lat, state.delivery_lng, zones)
  }

  const savedAddress = state.delivery_address

  const p_items = cart.map((c: any) => ({
    menu_id: c.menu_id,
    name: c.name,
    price: c.price,
    qty: c.qty,
  }))

  const { data: rpcResult, error } = await supabase.rpc('place_order', {
    p_customer_id: user.id,
    p_store_id: storeId,
    p_items: p_items,
    p_delivery_fee: DEFAULT_DELIVERY_FEE,
    p_lat: state.delivery_lat ?? null,
    p_lng: state.delivery_lng ?? null,
    p_address: state.delivery_address ?? null,
    p_note: null,
    p_payment_method: 'cash',
    p_zone_id: zoneId,
  })

  state.cart = []
  state.current_store_id = null
  state.step = null
  state.delivery_address = null
  state.delivery_lat = null
  state.delivery_lng = null
  await saveUserState(lineUserId, state)

  if (error || !rpcResult || rpcResult.ok === false) {
    return replyMessage(replyToken, [textMessage(
      '😅 สร้างออเดอร์ไม่สำเร็จ: ' + (rpcResult?.error || error?.message || 'ลองใหม่อีกครั้ง')
    )])
  }

  const order = rpcResult.order

  const itemsText = order.items.map((i: any) => `  ${i.qty}x ${i.name}`).join('\n')
  const msg = textMessage(`🍳 ออเดอร์ใหม่!\n━━━━━━━━━━━━━━\n📋 เลขที่: ${order.id.slice(0, 8)}\n💵 รวม: ${order.total} บาท\n📍 ${savedAddress || 'ไม่ระบุ'}\n📝 รายการ:\n${itemsText}\n━━━━━━━━━━━━━━`)
  pushToStore(storeId, [msg])
  if (process.env.LINE_USER_ID) {
    pushMessage(process.env.LINE_USER_ID, [msg])
  }

  return replyMessage(replyToken, [
    textMessage(`✅ สั่งออเดอร์สำเร็จ!\n━━━━━━━━━━━━━━\n📋 เลขที่ออเดอร์: ${order.id.slice(0, 8)}\n💵 ยอดรวม: ${order.total} บาท\n📍 ${savedAddress || 'ไม่ระบุ'}\n📌 รอเช็คสถานะ พิมพ์ "สถานะ ${order.id.slice(0, 8)}"\n━━━━━━━━━━━━━━\nขอบคุณที่ใช้บริการ 🙏`),
  ])
}

async function handleTextMessage(text: string, replyToken: string, lineUserId: string) {
  const state = await getUserState(lineUserId)

  // Help
  if (text === 'ช่วยเหลือ' || text === 'help') {
    return replyMessage(replyToken, [helpMessage()])
  }

  // Register: "สมัคร 092XXXXXXX"
  if (text.startsWith('สมัคร ') || text.startsWith('register ')) {
    const phone = text.replace(/^(สมัคร|register)\s+/, '').trim()
    if (!phone || phone.length < 10) {
      return replyMessage(replyToken, [textMessage('😅 กรุณาพิมพ์ "สมัคร 092XXXXXXX"')])
    }

    const { data: existing } = await supabase
      .from('customers').select('id').eq('phone', phone).single()
    if (existing) {
      return replyMessage(replyToken, [textMessage('😅 เบอร์นี้ลงทะเบียนแล้ว\nพิมพ์ "ผูก ' + phone + '" เพื่อผูก LINE')])
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    await supabase.from('otps').upsert(
      { phone, otp: hashOtp(phone, otp), expires_at: expiresAt, used: false },
      { onConflict: 'phone' }
    )

    pushMessage(lineUserId, [
      textMessage(`🔐 รหัส OTP สำหรับยืนยันเบอร์ ${phone}\n\nรหัส: ${otp}\n\nใช้ได้ 5 นาที`),
    ])

    state.step = 'register_otp'
    state.register_phone = phone
    await saveUserState(lineUserId, state)

    return replyMessage(replyToken, [textMessage(
      `📱 ส่งรหัส OTP ไปยัง LINE ของคุณแล้ว\nกรุณาพิมพ์รหัส 6 หลักเพื่อยืนยัน\n\nพิมพ์ "ยกเลิก" เพื่อยกเลิก`
    )])
  }

  // Handle OTP verification during registration
  if (state.step === 'register_otp' && /^\d{6}$/.test(text)) {
    const phone = state.register_phone
    if (!phone) {
      state.step = null
      await saveUserState(lineUserId, state)
      return replyMessage(replyToken, [textMessage('😅 เกิดข้อผิดพลาด กรุณาเริ่มใหม่ พิมพ์ "สมัคร"')])
    }

    const { data: otpData } = await supabase
      .from('otps').select('*')
      .eq('phone', phone).eq('otp', hashOtp(phone, text)).eq('used', false)
      .single()

    if (!otpData || new Date(otpData.expires_at) < new Date()) {
      return replyMessage(replyToken, [textMessage('😅 รหัส OTP ไม่ถูกต้องหรือหมดอายุ\nพิมพ์ "สมัคร" เพื่อขอรหัสใหม่')])
    }

    await supabase.from('otps').update({ used: true }).eq('phone', phone)

    const { data: newCustomer } = await supabase
      .from('customers').insert({ phone, points: 0, line_user_id: lineUserId })
      .select().single()

    if (!newCustomer) {
      return replyMessage(replyToken, [textMessage('😅 สมัครไม่สำเร็จ ลองอีกครั้ง')])
    }

    state.step = null
    state.register_phone = null
    await saveUserState(lineUserId, state)

    return replyMessage(replyToken, [textMessage(
      `✅ สมัครสมาชิกสำเร็จ!\n\nเบอร์: ${phone}\n\nตอนนี้คุณสามารถสั่งอาหารได้แล้ว 🎉\n\nพิมพ์ "เมนู" เพื่อเริ่มสั่ง`
    )])
  }

  // Link phone: "link 0929892085" or "ผูก 0929892085"
  if (text.startsWith('link ') || text.startsWith('ผูก ')) {
    const phone = text.replace(/^(link|ผูก)\s+/, '').trim()
    if (!phone || phone.length < 10) {
      return replyMessage(replyToken, [textMessage('😅 กรุณาพิมพ์ "ผูก 092XXXXXXX"')])
    }

    const { data: customer } = await supabase.from('customers').select('id').eq('phone', phone).single()
    const { data: store } = await supabase.from('stores').select('id').eq('phone', phone).single()
    const { data: rider } = await supabase.from('riders').select('id').eq('phone', phone).single()

    if (!customer && !store && !rider) {
      return replyMessage(replyToken, [textMessage('😅 ไม่พบเบอร์โทรนี้ในระบบ กรุณาลงทะเบียนก่อน')])
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    await supabase.from('otps').upsert(
      { phone, otp: hashOtp(phone, otp), expires_at: expiresAt, used: false },
      { onConflict: 'phone' }
    )

    pushMessage(lineUserId, [
      textMessage(`🔐 รหัส OTP สำหรับผูก LINE กับเบอร์ ${phone}\n\nรหัส: ${otp}\n\nใช้ได้ 5 นาที`),
    ])

    state.step = 'link_otp'
    state.link_phone = phone
    await saveUserState(lineUserId, state)

    return replyMessage(replyToken, [textMessage('📱 ส่งรหัส OTP ไปยัง LINE ของคุณแล้ว\nกรุณาพิมพ์รหัส 6 หลักเพื่อยืนยัน')])
  }

  // Handle OTP verification during link
  if (state.step === 'link_otp' && /^\d{6}$/.test(text)) {
    const phone = state.link_phone
    if (!phone) {
      state.step = null
      await saveUserState(lineUserId, state)
      return replyMessage(replyToken, [textMessage('😅 เกิดข้อผิดพลาด กรุณาเริ่มใหม่ พิมพ์ "ผูก เบอร์โทร"')])
    }

    const { data: otpData } = await supabase
      .from('otps').select('*')
      .eq('phone', phone).eq('otp', hashOtp(phone, text)).eq('used', false)
      .single()

    if (!otpData || new Date(otpData.expires_at) < new Date()) {
      return replyMessage(replyToken, [textMessage('😅 รหัส OTP ไม่ถูกต้องหรือหมดอายุ\nพิมพ์ "ผูก ' + phone + '" ใหม่')])
    }

    await supabase.from('otps').update({ used: true }).eq('phone', phone)

    const { data: customer } = await supabase.from('customers').select('id').eq('phone', phone).single()
    const { data: store } = await supabase.from('stores').select('id').eq('phone', phone).single()
    const { data: rider } = await supabase.from('riders').select('id').eq('phone', phone).single()
    if (customer) await supabase.from('customers').update({ line_user_id: lineUserId }).eq('id', customer.id)
    if (store) await supabase.from('stores').update({ line_user_id: lineUserId }).eq('id', store.id)
    if (rider) await supabase.from('riders').update({ line_user_id: lineUserId }).eq('id', rider.id)

    state.step = null
    state.link_phone = null
    await saveUserState(lineUserId, state)

    return replyMessage(replyToken, [textMessage(`✅ ผูก LINE กับเบอร์ ${phone} สำเร็จ!\nต่อจากนี้ OTP จะส่งมาให้คุณโดยตรง`)])
  }

  // Unlink: "unlink" or "เลิกผูก"
  if (text === 'unlink' || text === 'เลิกผูก') {
    await supabase.from('customers').update({ line_user_id: null }).eq('line_user_id', lineUserId)
    await supabase.from('stores').update({ line_user_id: null }).eq('line_user_id', lineUserId)
    await supabase.from('riders').update({ line_user_id: null }).eq('line_user_id', lineUserId)
    return replyMessage(replyToken, [textMessage('✅ เลิกผูก LINE เรียบร้อย')])
  }

  // Show store list
  if (text === 'เมนู' || text === 'ร้านค้า' || text === 'ร้าน') {
    const { data: stores } = await supabase.from('stores').select('*').order('name')
    if (!stores || stores.length === 0) {
      return replyMessage(replyToken, [textMessage('😅 ยังไม่มีร้านค้าในระบบ')])
    }
    return replyMessage(replyToken, [
      textMessage('🏪 ร้านค้าที่เปิดอยู่'),
      storeListFlex(stores),
    ])
  }

  // Show store menu: "เมนู S01" or "ร้าน ก๋วยเตี๋ยว"
  if (text.startsWith('เมนู ') || text.startsWith('ร้าน ')) {
    const query = text.replace(/^(เมนู|ร้าน)\s+/, '')
    const { data: store } = await supabase
      .from('stores').select('*')
      .or(`id.eq.${query},name.ilike.%${query}%`)
      .single()

    if (!store) {
      return replyMessage(replyToken, [textMessage('😅 ไม่พบร้านค้านี้')])
    }

    const { data: items } = await supabase
      .from('menu_items').select('*').eq('store_id', store.id).order('name')

    if (!items || items.length === 0) {
      return replyMessage(replyToken, [textMessage(`😅 ร้าน ${store.name} ยังไม่มีเมนู`)])
    }

    state.current_store_id = store.id
    state.cart = state.cart || []
    await saveUserState(lineUserId, state)

    return replyMessage(replyToken, [
      textMessage(`🍳 ${store.name}\nเลือกเมนูที่ต้องการ:`),
      menuFlex(items),
    ])
  }

  // Add to cart: "+ก๋วยเตี๋ยวน้ำใส"
  if (text.startsWith('+')) {
    const itemName = text.slice(1).trim()
    const storeId = state.current_store_id

    if (!storeId) {
      return replyMessage(replyToken, [textMessage('😅 กรุณาเลือกร้านก่อน พิมพ์ "เมนู" เพื่อดูร้าน')])
    }

    const { data: item } = await supabase
      .from('menu_items').select('*')
      .eq('store_id', storeId)
      .ilike('name', `%${itemName}%`)
      .single()

    if (!item) {
      return replyMessage(replyToken, [textMessage(`😅 ไม่พบ "${itemName}" ในร้านนี้`)])
    }

    const cart = state.cart || []
    const existing = cart.find((c: any) => c.menu_id === item.id)
    if (existing) {
      existing.qty += 1
    } else {
      cart.push({ menu_id: item.id, name: item.name, price: item.price, qty: 1 })
    }
    state.cart = cart
    await saveUserState(lineUserId, state)

    return replyMessage(replyToken, [
      textMessage(`✅ เพิ่ม ${item.name} x1 เรียบร้อย! (รวม ${cart.length} รายการ)`),
    ])
  }

  // View cart
  if (text === 'ตะกร้า' || text === 'cart') {
    const cart = state.cart || []
    if (cart.length === 0) {
      return replyMessage(replyToken, [textMessage('🛒 ตะกร้าว่างอยู่ เลือกเมนูก่อน')])
    }
    const total = cart.reduce((sum: number, c: any) => sum + c.price * c.qty, 0)
    return replyMessage(replyToken, [cartFlex(cart, total)])
  }

  // Start order flow: ask for delivery address first
  if (text === 'สั่ง' || text === 'confirm') {
    const cart = state.cart || []
    const storeId = state.current_store_id

    if (!storeId || cart.length === 0) {
      return replyMessage(replyToken, [textMessage('😅 ตะกร้าว่างหรือยังไม่ได้เลือกร้าน\nพิมพ์ "ตะกร้า" เพื่อดู หรือ "เมนู" เพื่อเลือกร้าน')])
    }

    const user = await findUserByLineId(lineUserId)
    if (!user || user.type !== 'customers') {
      return replyMessage(replyToken, [textMessage('😅 กรุณาผูก LINE กับเบอร์โทรก่อนสั่ง\nพิมพ์ "link 092XXXXXXX" เพื่อผูก')])
    }

    // Check if delivery address already saved
    if (state.delivery_address && state.step === 'confirm_address') {
      // Already have address — proceed to place order
      return await placeOrder(replyToken, lineUserId, state, user, storeId, cart)
    }

    // Ask for delivery address
    state.step = 'awaiting_address'
    await saveUserState(lineUserId, state)

    const total = cart.reduce((sum: number, c: any) => sum + c.price * c.qty, 0)
    return replyMessage(replyToken, [textMessage(
      `📍 กรุณาระบุที่อยู่จัดส่ง\n\nคุณสามารถ:\n• แชร์ตำแหน่งปัจจุบัน (แตะ + → ตำแหน่งที่ตั้ง)\n• หรือพิมพ์ที่อยู่\n\n💵 ยอดรวมอาหาร: ${total} บาท\n🚚 ค่าส่ง: ${DEFAULT_DELIVERY_FEE} บาท\n💰 รวมทั้งหมด: ${total + DEFAULT_DELIVERY_FEE} บาท\n\nพิมพ์ "ยกเลิก" เพื่อยกเลิก`
    )])
  }

  // Confirm address and place order
  if (text === 'ยืนยัน' && state.step === 'confirm_address') {
    const cart = state.cart || []
    const storeId = state.current_store_id

    if (!storeId || cart.length === 0) {
      return replyMessage(replyToken, [textMessage('😅 ตะกร้าว่างหรือยังไม่ได้เลือกร้าน')])
    }

    const user = await findUserByLineId(lineUserId)
    if (!user || user.type !== 'customers') {
      return replyMessage(replyToken, [textMessage('😅 กรุณาผูก LINE กับเบอร์โทรก่อนสั่ง')])
    }

    return await placeOrder(replyToken, lineUserId, state, user, storeId, cart)
  }

  // Cancel any flow
  if ((text === 'ยกเลิก' || text === 'cancel') && state.step) {
    const wasRegister = state.step === 'register_otp'
    const wasLink = state.step === 'link_otp'
    state.step = null
    state.delivery_address = null
    state.delivery_lat = null
    state.delivery_lng = null
    state.register_phone = null
    state.link_phone = null
    await saveUserState(lineUserId, state)
    return replyMessage(replyToken, [textMessage(
      wasRegister
        ? '✅ ยกเลิกการสมัครแล้ว'
        : wasLink
          ? '✅ ยกเลิกการผูก LINE แล้ว'
          : '✅ ยกเลิกการสั่งแล้ว\nพิมพ์ "เมนู" เพื่อเริ่มใหม่'
    )])
  }

  // If waiting for address, treat any text as address
  if (state.step === 'awaiting_address') {
    state.delivery_address = text
    state.step = 'confirm_address'
    await saveUserState(lineUserId, state)

    const cartTotal = (state.cart || []).reduce((s: number, c: any) => s + c.price * c.qty, 0)
    return replyMessage(replyToken, [textMessage(
      `📍 ที่อยู่จัดส่ง:\n${text}\n\n💵 ยอดรวมอาหาร: ${cartTotal} บาท\n🚚 ค่าส่ง: ${DEFAULT_DELIVERY_FEE} บาท\n💰 รวมทั้งหมด: ${cartTotal + DEFAULT_DELIVERY_FEE} บาท\n\nพิมพ์ "ยืนยัน" เพื่อสั่ง\nพิมพ์ "ยกเลิก" เพื่อเปลี่ยนที่อยู่`
    )])
  }

  // Check status: "สถานะ xxx"
  if (text.startsWith('สถานะ ') || text.startsWith('status ')) {
    const orderRef = text.replace(/^(สถานะ|status)\s+/, '').trim()

    const { data: order } = await supabase
      .from('orders').select('*, items:order_items(*)')
      .or(`id.ilike.${orderRef}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!order) {
      return replyMessage(replyToken, [textMessage(`😅 ไม่พบออเดอร์ ${orderRef}`)])
    }

    const itemsText = (order.items || []).map((i: any) => `  ${i.qty}x ${i.name}`).join('\n')
    return replyMessage(replyToken, [
      textMessage(`📋 ออเดอร์ ${order.id.slice(0, 8)}\n━━━━━━━━━━━━━━\n📌 สถานะ: ${order.status}\n💵 ยอดรวม: ${order.total} บาท\n📝 รายการ:\n${itemsText}\n━━━━━━━━━━━━━━`),
    ])
  }

  return replyMessage(replyToken, [
    textMessage(`👋 สวัสดีจ้า!\nพิมพ์ "ผูก 092XXXXXXX" เพื่อผูก LINE กับเบอร์โทร\nพิมพ์ "เมนู" เพื่อดูร้าน\nพิมพ์ "ช่วยเหลือ" สำหรับคำแนะนำ`),
  ])
}
