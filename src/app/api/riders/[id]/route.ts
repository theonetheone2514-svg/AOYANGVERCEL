import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'

export const GET = withAuth(async (request: Request, session, params) => {
  const { id } = params!
  const { data, error } = await supabase.from('riders').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: 'ไม่พบไรเดอร์' }, { status: 404 })
  if (session.user_type !== 'admin' && session.user_id !== id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }
  return NextResponse.json(data)
})

export const PATCH = withAuth(async (request: Request, session, params) => {
  const { id } = params!
  if (session.user_type !== 'admin' && session.user_id !== id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }
  const body = await request.json()
  const { data, error } = await supabase
    .from('riders').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})

export const DELETE = withAuth(async (request: Request, session, params) => {
  const { id } = params!

  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('rider_id', id)

  if (orderCount && orderCount > 0) {
    return NextResponse.json({
      error: `ไม่สามารถลบได้ เนื่องจากไรเดอร์มีออเดอร์อยู่ ${orderCount} รายการ`,
      orderCount,
    }, { status: 400 })
  }

  const { error } = await supabase.from('riders').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}, ['admin'])
