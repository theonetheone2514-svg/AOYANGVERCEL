import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'

export const POST = withAuth(async (request: Request, session) => {
  const body = await request.json()
  const { order_id } = body
  const rider_id = session.user_id

  if (!order_id) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
  }

  const { data: order } = await supabase
    .from('orders').select('rider_id, delivery_fee, total, customer_id, status').eq('id', order_id).single()

  if (!order) return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 })
  if (order.rider_id !== rider_id) return NextResponse.json({ error: 'ไม่ใช่งานของคุณ' }, { status: 403 })
  if (order.status === 'จัดส่งสำเร็จ') return NextResponse.json({ error: 'งานนี้เสร็จสิ้นแล้ว' }, { status: 409 })

  const deliveryFee = order.delivery_fee || 0

  const { data: currentRider } = await supabase
    .from('riders').select('earnings, jobs_count').eq('id', rider_id).single()

  const newEarnings = (Number(currentRider?.earnings) || 0) + deliveryFee
  const newJobs = (currentRider?.jobs_count || 0) + 1

  const { data: rider } = await supabase
    .from('riders')
    .update({ earnings: newEarnings, jobs_count: newJobs })
    .eq('id', rider_id)
    .select()
    .single()

  const { data: updatedOrder } = await supabase
    .from('orders').update({ status: 'จัดส่งสำเร็จ' }).eq('id', order_id).select().single()

  if (order?.customer_id) {
    const foodTotal = Number(order.total) - deliveryFee
    const pointsEarned = Math.floor(foodTotal / 20)
    if (pointsEarned > 0) {
      const { data: cust } = await supabase
        .from('customers')
        .select('points')
        .eq('id', order.customer_id)
        .single()
      await supabase
        .from('customers')
        .update({ points: (cust?.points || 0) + pointsEarned })
        .eq('id', order.customer_id)
    }
  }

  return NextResponse.json({ order: updatedOrder, rider })
}, ['rider'])
