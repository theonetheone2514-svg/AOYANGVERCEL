import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSession, getSessionCookieHeaders } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json()
  const { phone, otp, role } = body

  if (!phone || !otp || !role) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
  }

  if (role !== 'merchant' && role !== 'rider') {
    return NextResponse.json({ error: 'บทบาทไม่ถูกต้อง' }, { status: 400 })
  }

  // Verify OTP
  const { data: otpData } = await supabase
    .from('otps')
    .select('*')
    .eq('phone', phone)
    .eq('otp', otp)
    .eq('used', false)
    .single()

  if (!otpData) {
    return NextResponse.json({ error: 'รหัส OTP ไม่ถูกต้อง' }, { status: 400 })
  }

  if (new Date(otpData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'รหัส OTP หมดอายุแล้ว' }, { status: 400 })
  }

  await supabase.from('otps').update({ used: true }).eq('phone', phone)

  // Check phone already registered for this role
  if (role === 'merchant') {
    const { data: existing } = await supabase
      .from('stores').select('id').eq('phone', phone).single()
    if (existing) {
      return NextResponse.json({ error: 'เบอร์นี้ลงทะเบียนร้านค้าไว้แล้ว' }, { status: 400 })
    }
  } else {
    const { data: existing } = await supabase
      .from('riders').select('id').eq('phone', phone).single()
    if (existing) {
      return NextResponse.json({ error: 'เบอร์นี้ลงทะเบียนไรเดอร์ไว้แล้ว' }, { status: 400 })
    }
  }

  let userId: string | undefined
  let userType: 'merchant' | 'rider' = role

  if (role === 'merchant') {
    const { name } = body
    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อร้าน' }, { status: 400 })
    }
    // Generate next store ID
    const { data: maxStore } = await supabase
      .from('stores')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single()
    const nextNum = maxStore ? parseInt(maxStore.id.replace('S', '')) + 1 : 1
    const storeId = `S${String(nextNum).padStart(2, '0')}`

    const { data: store, error } = await supabase
      .from('stores')
      .insert({
        id: storeId,
        name,
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
    const { name, zone_id } = body
    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อ' }, { status: 400 })
    }

    const { data: rider, error } = await supabase
      .from('riders')
      .insert({
        name,
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
