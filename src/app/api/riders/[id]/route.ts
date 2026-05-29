import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/api-utils'
import { validate, updateRiderSchema } from '@/lib/validations'

export const GET = withAuth(async (request: Request, session, params) => {
  const { id } = params!
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from('riders').select('*').eq('id', id).single()
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
  const parsed = validate(updateRiderSchema, body)
  if (!parsed.success) return parsed.error

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('riders').update(parsed.data).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})

export const DELETE = withAuth(async (request: Request, session, params) => {
  const { id } = params!

  const admin = getSupabaseAdmin()
  const { count: orderCount } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('rider_id', id)

  if (orderCount && orderCount > 0) {
    return NextResponse.json({
      error: `ไม่สามารถลบได้ เนื่องจากไรเดอร์มีออเดอร์อยู่ ${orderCount} รายการ`,
      orderCount,
    }, { status: 400 })
  }

  const { error } = await admin.from('riders').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}, ['admin'])
