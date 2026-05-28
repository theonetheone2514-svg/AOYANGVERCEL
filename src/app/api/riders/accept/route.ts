import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'

export const POST = withAuth(async (request: Request, session) => {
  const body = await request.json()
  const { order_id } = body
  const rider_id = session.user_id

  if (!order_id) {
    return NextResponse.json({ error: 'กรุณาระบุออเดอร์' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('orders')
    .select('rider_id, status')
    .eq('id', order_id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 })
  }

  if (existing.rider_id) {
    return NextResponse.json({ error: 'งานนี้มีคนรับไปแล้ว' }, { status: 409 })
  }

  if (existing.status !== 'พร้อมจัดส่ง') {
    return NextResponse.json({ error: 'ออเดอร์นี้ยังไม่พร้อมจัดส่ง' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ rider_id, status: 'กำลังจัดส่ง' })
    .eq('id', order_id)
    .is('rider_id', null)
    .select('*, items:order_items(*)')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'งานนี้มีคนรับไปแล้ว' }, { status: 409 })
  }

  return NextResponse.json(data)
}, ['rider'])
