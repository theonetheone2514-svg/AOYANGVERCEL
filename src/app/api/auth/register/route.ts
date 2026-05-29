import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createSession, getSessionCookieHeaders } from '@/lib/auth'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { validate, registerSchema } from '@/lib/validations'
import { validateOrigin, originError } from '@/lib/csrf'

function hashOtp(phone: string, otp: string): string {
  return createHash('sha256').update(`${phone}:${otp}`).digest('hex')
}

export async function POST(request: Request) {
  if (!validateOrigin(request)) return originError()

  const ip = getIp(request)
  const rl = await rateLimit(`register:${ip}`, { maxRequests: 5, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'โหลดเยอะเกินไป กรุณาลองใหม่ภายหลัง' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) }
    })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 }) }
  const validated = validate(registerSchema, body)
  if (validated.error) return validated.error
  const { phone, otp, role } = validated.data!
  const v = validated.data as { phone: string; otp: string; role: 'merchant' | 'rider'; name?: string }

  // Verify OTP (hashed comparison)
  const { data: otpData } = await supabase
    .from('otps')
    .select('*')
    .eq('phone', phone)
    .eq('otp', hashOtp(phone, otp))
    .single()

  if (!otpData) {
    return NextResponse.json({ error: 'รหัส OTP ไม่ถูกต้อง' }, { status: 400 })
  }

  if (new Date(otpData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'รหัส OTP หมดอายุแล้ว' }, { status: 400 })
  }

  await supabase.from('otps').update({ used: true }).eq('phone', phone)

  const admin = getSupabaseAdmin()

  // Check phone already registered for this role
  if (role === 'merchant') {
    const { data: existing } = await admin
      .from('stores').select('id').eq('phone', phone).single()
    if (existing) {
      return NextResponse.json({ error: 'เบอร์นี้ลงทะเบียนร้านค้าไว้แล้ว' }, { status: 400 })
    }
  } else {
    const { data: existing } = await admin
      .from('riders').select('id').eq('phone', phone).single()
    if (existing) {
      return NextResponse.json({ error: 'เบอร์นี้ลงทะเบียนไรเดอร์ไว้แล้ว' }, { status: 400 })
    }
  }

  let userId: string | undefined
  const userType: 'merchant' | 'rider' = role

  if (role === 'merchant') {
    // Generate next store ID
    const { data: maxStore } = await admin
      .from('stores')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single()
    const nextNum = maxStore ? parseInt(maxStore.id.replace('S', '')) + 1 : 1
    const storeId = `S${String(nextNum).padStart(2, '0')}`

    const { data: store, error } = await admin
      .from('stores')
      .insert({
        id: storeId,
        name: v.name!,
        phone,
        status: 'closed',
        wait_time: 20,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'สมัครไม่สำเร็จ ' + error.message }, { status: 500 })
    }
    userId = store.id
  } else {
    const rawBody = body as Record<string, unknown>
    const zone_id = rawBody.zone_id as string | undefined

    const { data: rider, error } = await admin
      .from('riders')
      .insert({
        name: v.name!,
        phone,
        zone_id: zone_id || null,
        earnings: 0,
        jobs_count: 0,
        online: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'สมัครไม่สำเร็จ ' + error.message }, { status: 500 })
    }
    userId = rider.id
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
