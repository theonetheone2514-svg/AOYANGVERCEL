import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createSession, getSessionCookieHeaders } from '@/lib/auth'
import { ADMIN_PHONES } from '@/lib/constants'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { validate, verifyOtpSchema } from '@/lib/validations'
import { validateOrigin, originError } from '@/lib/csrf'

function hashOtp(phone: string, otp: string): string {
  return createHash('sha256').update(`${phone}:${otp}`).digest('hex')
}

export async function POST(request: Request) {
  if (!validateOrigin(request)) return originError()

  const ip = getIp(request)
  const rl = await rateLimit(`verify-otp:${ip}`, { maxRequests: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'โหลดเยอะเกินไป กรุณาลองใหม่ภายหลัง' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) }
    })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 }) }
  const validated = validate(verifyOtpSchema, body)
  if (validated.error) return validated.error
  const { phone, otp } = validated.data!

  if (!phone || !otp) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('otps')
    .select('*')
    .eq('phone', phone)
    .eq('otp', hashOtp(phone, otp))
    .eq('used', false)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'รหัส OTP ไม่ถูกต้อง' }, { status: 400 })
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'รหัส OTP หมดอายุแล้ว' }, { status: 400 })
  }

  await supabase.from('otps').update({ used: true }).eq('phone', phone)

  // Determine user type and ID
  let userType: 'customer' | 'merchant' | 'rider' | 'admin' = 'customer'
  let userId: string | undefined
  const admin = getSupabaseAdmin()

  const { data: store } = await admin.from('stores').select('id').eq('phone', phone).single()
  if (store) {
    // Check if store is deactivated by admin
    const { data: deactivated } = await admin
      .from('settings').select('value').eq('key', `deactivated_store:${store.id}`).single()
    if (deactivated?.value === 'true') {
      return NextResponse.json({ error: 'ร้านค้าถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' }, { status: 403 })
    }
    userType = 'merchant'
    userId = store.id
  }

  const { data: rider } = await admin.from('riders').select('id').eq('phone', phone).single()
  if (rider) {
    // Check if rider is deactivated by admin
    const { data: deactivated } = await admin
      .from('settings').select('value').eq('key', `deactivated_rider:${rider.id}`).single()
    if (deactivated?.value === 'true') {
      return NextResponse.json({ error: 'ไรเดอร์ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' }, { status: 403 })
    }
    userType = 'rider'
    userId = rider.id
  }

  if (!store && !rider) {
    const { data: existing } = await admin
      .from('customers').select('id, name').eq('phone', phone).single()

    if (existing) {
      userId = existing.id
    } else {
      const { data: newCustomer } = await admin
        .from('customers').insert({ phone, points: 0 }).select().single()
      userId = newCustomer?.id
    }
  }

  // Admin override (takes priority)
  if (ADMIN_PHONES.includes(phone)) {
    userType = 'admin'
    userId = 'admin001'
  }

  const token = await createSession(phone, userType, userId)

  const response = NextResponse.json({
    success: true,
    user: { phone, type: userType, id: userId },
  })

  const headers = getSessionCookieHeaders(token)
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }

  return response
}
