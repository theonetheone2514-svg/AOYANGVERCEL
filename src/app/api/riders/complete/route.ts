import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { rider_id, order_id } = body

  if (!rider_id || !order_id) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
  }

  const { data: order } = await supabase
    .from('orders').select('delivery_fee, total, customer_id').eq('id', order_id).single()

  const deliveryFee = order?.delivery_fee || 0

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

  // Award loyalty points (1 point per 20 THB of food total)
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
}
