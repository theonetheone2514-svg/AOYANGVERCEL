import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { order_id } = await request.json()

  if (!order_id) return NextResponse.json({ error: 'กรุณาระบุออเดอร์' }, { status: 400 })

  const { data, error } = await supabase
    .from('orders').update({ status: 'จัดส่งสำเร็จ' }).eq('id', order_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
