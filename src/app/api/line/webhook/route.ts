import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  replyMessage, pushMessage, textMessage,
  storeListFlex, menuFlex, cartFlex, helpMessage,
} from '@/lib/line'
import { DEFAULT_DELIVERY_FEE } from '@/lib/constants'
import { rateLimit, getIp } from '@/lib/rate-limit'

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
  const rl = rateLimit(`webhook:${ip}`, { maxRequests: 60, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
  }

  const body = await request.json()
  const events = body.events || []

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim()
      const replyToken = event.replyToken
      const lineUserId = event.source.userId

      await handleTextMessage(text, replyToken, lineUserId)
    }
  }

  return NextResponse.json({ success: true })
}

async function handleTextMessage(text: string, replyToken: string, lineUserId: string) {
  const state = await getUserState(lineUserId)

  // Help
  if (text === 'ช่วยเหลือ' || text === 'help') {
    return replyMessage(replyToken, [helpMessage()])
  }

  // Link phone: "link 0929892085" or "ผูก 0929892085"
  if (text.startsWith('link ') || text.startsWith('ผูก ')) {
    const phone = text.replace(/^(link|ผูก)\s+/, '').trim()
    if (!phone || phone.length < 10) {
      return replyMessage(replyToken, [textMessage('😅 กรุณาพิมพ์ "link 092XXXXXXX" หรือ "ผูก 092XXXXXXX"')])
    }

    const { data: customer } = await supabase
      .from('customers').select('id').eq('phone', phone).single()
    const { data: store } = await supabase
      .from('stores').select('id').eq('phone', phone).single()
    const { data: rider } = await supabase
      .from('riders').select('id').eq('phone', phone).single()

    if (!customer && !store && !rider) {
      return replyMessage(replyToken, [textMessage('😅 ไม่พบเบอร์โทรนี้ในระบบ กรุณาลงทะเบียนก่อน')])
    }

    if (customer) await supabase.from('customers').update({ line_user_id: lineUserId }).eq('id', customer.id)
    if (store) await supabase.from('stores').update({ line_user_id: lineUserId }).eq('id', store.id)
    if (rider) await supabase.from('riders').update({ line_user_id: lineUserId }).eq('id', rider.id)

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

  // Confirm order
  if (text === 'สั่ง' || text === 'ยืนยันสั่งอาหาร' || text === 'confirm') {
    const cart = state.cart || []
    const storeId = state.current_store_id

    if (!storeId || cart.length === 0) {
      return replyMessage(replyToken, [textMessage('😅 ตะกร้าว่างหรือยังไม่ได้เลือกร้าน')])
    }

    const user = await findUserByLineId(lineUserId)
    if (!user || user.type !== 'customers') {
      return replyMessage(replyToken, [textMessage('😅 กรุณาผูก LINE กับเบอร์โทรก่อนสั่ง\nพิมพ์ "link 092XXXXXXX" เพื่อผูก')])
    }

    const total = cart.reduce((sum: number, c: any) => sum + c.price * c.qty, 0)

    const { data: order, error } = await supabase
      .from('orders').insert({
        customer_id: user.id,
        store_id: storeId,
        total: total + DEFAULT_DELIVERY_FEE,
        delivery_fee: DEFAULT_DELIVERY_FEE,
        status: 'รอดำเนินการ',
      }).select().single()

    if (error || !order) {
      return replyMessage(replyToken, [textMessage('😅 สร้างออเดอร์ไม่สำเร็จ ลองใหม่อีกครั้ง')])
    }

    const orderItems = cart.map((c: any) => ({
      order_id: order.id,
      menu_id: c.menu_id,
      name: c.name,
      price: c.price,
      qty: c.qty,
    }))
    await supabase.from('order_items').insert(orderItems)

    state.cart = []
    state.current_store_id = null
    await saveUserState(lineUserId, state)

    const itemsText = orderItems.map((i: any) => `  ${i.qty}x ${i.name}`).join('\n')
    pushMessage(process.env.LINE_USER_ID!, [
      textMessage(`🍳 ออเดอร์ใหม่!\n━━━━━━━━━━━━━━\n📋 เลขที่: ${order.id.slice(0, 8)}\n💵 รวม: ${order.total} บาท\n📝 รายการ:\n${itemsText}\n━━━━━━━━━━━━━━`),
    ])

    return replyMessage(replyToken, [
      textMessage(`✅ สั่งออเดอร์สำเร็จ!\n━━━━━━━━━━━━━━\n📋 เลขที่ออเดอร์: ${order.id.slice(0, 8)}\n💵 ยอดรวม: ${order.total} บาท\n📌 รอเช็คสถานะ พิมพ์ "สถานะ ${order.id.slice(0, 8)}"\n━━━━━━━━━━━━━━\nขอบคุณที่ใช้บริการ 🙏`),
    ])
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
