import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateOtp } from '@/lib/auth'

const RATE_LIMIT_MS = 60_000

export async function POST(request: Request) {
  const { phone } = await request.json()

  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: 'กรุณากรอกเบอร์โทรให้ถูกต้อง' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('otps')
    .select('expires_at')
    .eq('phone', phone)
    .single()

  if (existing) {
    const lastSent = new Date(existing.expires_at).getTime() - 5 * 60 * 1000
    if (Date.now() - lastSent < RATE_LIMIT_MS) {
      return NextResponse.json({ error: 'กรุณารอ 1 นาทีแล้วลองใหม่' }, { status: 429 })
    }
  }

  const otp = generateOtp()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  await supabase.from('otps').upsert(
    { phone, otp, expires_at: expiresAt, used: false },
    { onConflict: 'phone' }
  )

  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const lineUserId = process.env.LINE_USER_ID

  if (lineToken) {
    const message = `🔐 รหัส OTP ของคุณคือ ${otp}\n\nรหัสนี้ใช้ได้ 5 นาที\n\n*ถ้าไม่ได้ขอรหัส ให้เพิกเฉยได้เลย`
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: 'text', text: message }],
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, message: 'ส่ง OTP ทาง LINE แล้ว' })
}
