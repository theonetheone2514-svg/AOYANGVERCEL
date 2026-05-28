import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'

export const POST = withAuth(async (request: Request, session) => {
  const { order_id } = await request.json()

  if (!order_id) return NextResponse.json({ error: 'กรุณาระบุออเดอร์' }, { status: 400 })

  const { data: order } = await supabase
    .from('orders').select('rider_id, status').eq('id', order_id).single()

  if (!order) return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 })
  if (order.rider_id !== session.user_id) {
    return NextResponse.json({ error: 'ไม่ใช่งานของคุณ' }, { status: 403 })
  }
  if (order.status === 'จัดส่งสำเร็จ') {
    return NextResponse.json({ error: 'งานนี้ดำเนินการเสร็จสิ้นแล้ว' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('orders').update({ status: 'จัดส่งสำเร็จ' }).eq('id', order_id).eq('rider_id', session.user_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}, ['rider'])
