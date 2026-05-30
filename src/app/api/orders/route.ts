import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { pushMessage, pushToStore, textMessage } from '@/lib/line'
import { withAuth } from '@/lib/api-utils'
import { DEFAULT_DELIVERY_FEE } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'
import { validate, createOrderSchema } from '@/lib/validations'
import { findZoneId } from '@/lib/utils'

export const POST = withAuth(async (request: Request, session) => {
  const limit = await checkRateLimit(`order:${session.user_id}`, { maxRequests: 10, windowMs: 60_000 })
  if (limit) return limit

  const body = await request.json()
  const validated = validate(createOrderSchema, body)
  if (!validated.success) return validated.error

  const { store_id, items, delivery_fee, lat, lng, address, note, payment_method, idempotency_key } = validated.data

  const admin = getSupabaseAdmin()

  if (idempotency_key) {
    const { data: existing } = await admin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('idempotency_key', idempotency_key)
      .single()

    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }
  }

  const df = delivery_fee ?? DEFAULT_DELIVERY_FEE

  let zoneId: string | null = null
  if (lat && lng) {
    const { data: zones } = await admin.from('zones').select('id, lat, lng, radius')
    if (zones) zoneId = findZoneId(lat, lng, zones)
  }

  const { data, error } = await admin.rpc('place_order', {
    p_customer_id: session.user_id,
    p_store_id: store_id,
    p_items: items.map((i: { menu_id: string; name: string; price: number; qty: number }) => ({
      menu_id: i.menu_id,
      name: i.name,
      price: i.price,
      qty: i.qty,
    })),
    p_delivery_fee: df,
    p_lat: lat ?? null,
    p_lng: lng ?? null,
    p_address: address ?? null,
    p_note: note ?? null,
    p_payment_method: payment_method || 'cash',
    p_zone_id: zoneId,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data.ok === false) {
    return NextResponse.json({ error: data.error }, { status: 400 })
  }

  const order = data.order

  if (idempotency_key) {
    await admin.from('orders').update({ idempotency_key }).eq('id', order.id)
  }

  // Save delivery location for next time
  if (lat && lng) {
    await admin.from('customer_locations').upsert({
      customer_id: session.user_id,
      lat,
      lng,
      address: address ?? null,
    }).maybeSingle()
  }

  const itemsText = order.items.map((i: { name: string; price: number; qty: number }) =>
    `  ${i.qty}x ${i.name}  ${i.price * i.qty} บาท`
  ).join('\n')
  const msg = textMessage(
    `🆕 ออเดอร์ใหม่!\n━━━━━━━━━━━━━━\n${itemsText}\n━━━━━━━━━━━━━━\n💵 รวม: ${order.total} บาท\n📍 ${order.address || 'ไม่ระบุ'}\n📝 ${order.note || '-'}\n━━━━━━━━━━━━━━\n#${order.id.slice(0, 8)}`
  )
  pushToStore(store_id, [msg])
  if (process.env.LINE_USER_ID) {
    pushMessage(process.env.LINE_USER_ID, [msg])
  }

  return NextResponse.json(order, { status: 201 })
}, ['customer'])

export const GET = withAuth(async (request: Request, session) => {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('store_id')
  const customerId = searchParams.get('customer_id')
  const riderId = searchParams.get('rider_id')
  const status = searchParams.get('status')
  const zoneId = searchParams.get('zone_id')

  const admin = getSupabaseAdmin()
  let query = admin.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false })

  if (storeId) query = query.eq('store_id', storeId)
  if (customerId) query = query.eq('customer_id', customerId)
  if (riderId) query = query.eq('rider_id', riderId)
  if (status) query = query.eq('status', status)
  if (zoneId) query = query.eq('zone_id', zoneId)

  if (session.user_type === 'admin') {
  } else if (session.user_type === 'merchant') {
    const { data: stores } = await admin.from('stores').select('id').eq('phone', session.phone)
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
