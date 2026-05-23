import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(request: Request) {
  const body = await request.json()
  const { customer_id, points } = body

  if (!customer_id || points === undefined) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('customers').update({ points }).eq('id', customer_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
