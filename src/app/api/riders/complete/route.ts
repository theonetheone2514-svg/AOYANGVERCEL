import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'

export const POST = withAuth(async (request: Request, session) => {
  const { order_id } = await request.json()

  if (!order_id) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('complete_order', {
    p_order_id: order_id,
    p_rider_id: session.user_id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data.ok === false) {
    const status = data.error === 'ไม่พบออเดอร์' ? 404
      : data.error === 'ไม่ใช่งานของคุณ' ? 403
      : 409
    return NextResponse.json({ error: data.error }, { status })
  }

  const [updatedOrder, rider] = await Promise.all([
    supabase.from('orders').select('*').eq('id', order_id).single(),
    supabase.from('riders').select('*').eq('id', session.user_id).single(),
  ])

  return NextResponse.json({ order: updatedOrder.data, rider: rider.data })
}, ['rider'])
