import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'

export const POST = withAuth(async (request: Request, session) => {
  const { order_id } = await request.json()

  if (!order_id) {
    return NextResponse.json({ error: 'กรุณาระบุออเดอร์' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('accept_order', {
    p_order_id: order_id,
    p_rider_id: session.user_id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data.ok === false) {
    const status = data.error === 'ไม่พบออเดอร์' ? 404 : 409
    return NextResponse.json({ error: data.error }, { status })
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', order_id)
    .single()

  return NextResponse.json(order)
}, ['rider'])
