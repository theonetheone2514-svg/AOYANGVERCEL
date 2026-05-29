import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { validate, orderIdSchema } from '@/lib/validations'

export const POST = withAuth(async (request: Request, session) => {
  const limit = await checkRateLimit(`rider-arrive:${session.user_id}`, { maxRequests: 20, windowMs: 60_000 })
  if (limit) return limit
  const body = await request.json()
  const parsed = validate(orderIdSchema, body)
  if (!parsed.success) return parsed.error

  const admin = getSupabaseAdmin()
  const { data: order } = await admin
    .from('orders').select('rider_id, status').eq('id', parsed.data.order_id).single()

  if (!order) return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 })
  if (order.rider_id !== session.user_id) {
    return NextResponse.json({ error: 'ไม่ใช่งานของคุณ' }, { status: 403 })
  }
  if (order.status === 'จัดส่งสำเร็จ') {
    return NextResponse.json({ error: 'งานนี้ดำเนินการเสร็จสิ้นแล้ว' }, { status: 409 })
  }

  const { data, error } = await admin
    .from('orders').update({ status: 'จัดส่งสำเร็จ' }).eq('id', parsed.data.order_id).eq('rider_id', session.user_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}, ['rider'])
