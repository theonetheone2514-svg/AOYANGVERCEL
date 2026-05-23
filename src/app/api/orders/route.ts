import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { customer_id, store_id, items, delivery_fee, lat, lng, address, note, payment_method } = body

  if (!customer_id || !store_id || !items || items.length === 0) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
  }

  const foodTotal = items.reduce((sum: number, item: { price: number; qty: number }) =>
    sum + item.price * item.qty, 0
  )
  const total = foodTotal + (delivery_fee || 10)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id,
      store_id,
      total,
      delivery_fee: delivery_fee || 10,
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

  // Send LINE notification
  fetch(new URL('/api/line/send', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'new_order',
      order_id: order.id,
      store_id,
      total,
      items: orderItems,
      customer_id,
      note,
      address,
    }),
  }).catch(() => {})

  return NextResponse.json({ ...order, items: orderItems }, { status: 201 })
}

export async function GET(request: Request) {
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

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
