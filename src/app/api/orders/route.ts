import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { pushMessage, textMessage } from '@/lib/line'
import { withAuth } from '@/lib/api-utils'
import { DEFAULT_DELIVERY_FEE } from '@/lib/constants'

export const POST = withAuth(async (request: Request, session) => {
  const body = await request.json()
  const { store_id, items, delivery_fee, lat, lng, address, note, payment_method } = body

  if (!store_id || !items || items.length === 0) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
  }
  const customer_id = session.user_id

  const menuIds = items.map((i: { menu_id: string }) => i.menu_id)
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, name, price, stock')
    .in('id', menuIds)

  const menuMap = new Map(menuItems?.map(m => [m.id, m]) || [])

  for (const item of items) {
    const dbItem = menuMap.get(item.menu_id)
    if (!dbItem) {
      return NextResponse.json({ error: `ไม่พบเมนู ${item.name}` }, { status: 400 })
    }
    if (dbItem.stock !== null && dbItem.stock !== undefined && dbItem.stock < item.qty) {
      return NextResponse.json({ error: `${dbItem.name} คงเหลือไม่เพียงพอ (เหลือ ${dbItem.stock})` }, { status: 400 })
    }
  }

  const df = delivery_fee ?? DEFAULT_DELIVERY_FEE
  const foodTotal = items.reduce((sum: number, item: { price: number; qty: number }) =>
    sum + item.price * item.qty, 0
  )
  const total = foodTotal + df

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id,
      store_id,
      total,
      delivery_fee: df,
      lat,
      lng,
      address,
      note,
      payment_method: payment_method || 'cash',
      status: 'รอดำเนินการ',
    })
    .select()
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  const orderItems = items.map((item: { menu_id: string; name: string; price: number; qty: number }) => ({
    order_id: order.id,
    menu_id: item.menu_id,
    name: item.name,
    price: item.price,
    qty: item.qty,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  for (const item of items) {
    const dbItem = menuMap.get(item.menu_id)
    if (dbItem?.stock !== null && dbItem?.stock !== undefined) {
      await supabase
        .from('menu_items')
        .update({ stock: dbItem.stock - item.qty })
        .eq('id', item.menu_id)
    }
  }

  if (process.env.LINE_USER_ID) {
    const itemsText = orderItems.map((i: { name: string; price: number; qty: number }) => `  ${i.qty}x ${i.name}  ${i.price * i.qty} บาท`).join('\n')
    pushMessage(process.env.LINE_USER_ID, [
      textMessage(
        `🆕 ออเดอร์ใหม่!\n━━━━━━━━━━━━━━\n${itemsText}\n━━━━━━━━━━━━━━\n💵 รวม: ${total} บาท\n📍 ${address || 'ไม่ระบุ'}\n📝 ${note || '-'}\n━━━━━━━━━━━━━━\n#${order.id.slice(0, 8)}`
      ),
    ])
  }

  return NextResponse.json({ ...order, items: orderItems }, { status: 201 })
}, ['customer'])

export const GET = withAuth(async (request: Request, session) => {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('store_id')
  const customerId = searchParams.get('customer_id')
  const riderId = searchParams.get('rider_id')
  const status = searchParams.get('status')
  const zoneId = searchParams.get('zone_id')

  let query = supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false })

  if (storeId) query = query.eq('store_id', storeId)
  if (customerId) query = query.eq('customer_id', customerId)
  if (riderId) query = query.eq('rider_id', riderId)
  if (status) query = query.eq('status', status)
  if (zoneId) query = query.eq('zone_id', zoneId)

  if (session.user_type === 'admin') {
  } else if (session.user_type === 'merchant') {
    const { data: stores } = await supabase.from('stores').select('id').eq('phone', session.phone)
    const storeIds = stores?.map(s => s.id) || []
    query = query.in('store_id', storeIds)
  } else if (session.user_type === 'rider') {
    query = query.eq('rider_id', session.user_id)
  } else {
    query = query.eq('customer_id', session.user_id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})
