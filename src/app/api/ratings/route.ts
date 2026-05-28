import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'

export const POST = withAuth(async (request: Request, session) => {
  const body = await request.json()
  const { order_id, store_id, rating, review } = body
  const customer_id = session.user_id

  if (!order_id || !store_id || !rating) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'คะแนนต้องอยู่ระหว่าง 1-5' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ratings')
    .insert({ order_id, customer_id, store_id, rating, review: review || null })
    .select()
    .single()

  if (error && error.code === '23505') {
    return NextResponse.json({ error: 'คุณให้คะแนนออเดอร์นี้ไปแล้ว' }, { status: 409 })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}, ['customer'])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('store_id')

  let query = supabase.from('ratings').select('*')

  if (storeId) query = query.eq('store_id', storeId)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
