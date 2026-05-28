import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'

export const POST = withAuth(async (request: Request, session) => {
  const limit = checkRateLimit(`link:${session.user_id}`, { maxRequests: 10, windowMs: 60_000 })
  if (limit) return limit

  const body = await request.json()
  const { line_user_id } = body

  if (!line_user_id) {
    return NextResponse.json({ error: 'กรุณาระบุ LINE user ID' }, { status: 400 })
  }

  const phone = session.phone

  const { data: customer } = await supabase
    .from('customers').select('id').eq('phone', phone).single()
  const { data: store } = await supabase
    .from('stores').select('id').eq('phone', phone).single()
  const { data: rider } = await supabase
    .from('riders').select('id').eq('phone', phone).single()

  if (customer) await supabase.from('customers').update({ line_user_id }).eq('id', customer.id)
  if (store) await supabase.from('stores').update({ line_user_id }).eq('id', store.id)
  if (rider) await supabase.from('riders').update({ line_user_id }).eq('id', rider.id)

  return NextResponse.json({ success: true, message: 'ผูก LINE สำเร็จ' })
})
