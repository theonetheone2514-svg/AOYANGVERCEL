import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { rider_id, order_id } = body

  if (!rider_id || !order_id) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ rider_id, status: 'กำลังจัดส่ง' })
    .eq('id', order_id)
    .select('*, items:order_items(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
