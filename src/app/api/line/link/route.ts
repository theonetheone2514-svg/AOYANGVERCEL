import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { validate, lineLinkSchema } from '@/lib/validations'

export const POST = withAuth(async (request: Request, session) => {
  const limit = await checkRateLimit(`link:${session.user_id}`, { maxRequests: 10, windowMs: 60_000 })
  if (limit) return limit

  const body = await request.json()
  const parsed = validate(lineLinkSchema, body)
  if (parsed.error) return parsed.error

  const { line_user_id } = parsed.data
  const phone = session.phone
  const admin = getSupabaseAdmin()

  const { data: customer } = await admin
    .from('customers').select('id').eq('phone', phone).single()
  const { data: store } = await admin
    .from('stores').select('id').eq('phone', phone).single()
  const { data: rider } = await admin
    .from('riders').select('id').eq('phone', phone).single()

  if (customer) await admin.from('customers').update({ line_user_id }).eq('id', customer.id)
  if (store) await admin.from('stores').update({ line_user_id }).eq('id', store.id)
  if (rider) await admin.from('riders').update({ line_user_id }).eq('id', rider.id)

  return NextResponse.json({ success: true, message: 'ผูก LINE สำเร็จ' })
})
