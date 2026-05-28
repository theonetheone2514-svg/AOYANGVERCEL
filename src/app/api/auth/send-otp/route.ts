import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateOtp } from '@/lib/auth'
import { pushMessage } from '@/lib/line'

const RATE_LIMIT_MS = 60_000

async function getLineUserId(phone: string): Promise<string | null> {
  for (const table of ['customers', 'stores', 'riders'] as const) {
    const { data } = await supabase
      .from(table)
      .select('line_user_id')
      .eq('phone', phone)
      .single()
    if (data?.line_user_id) return data.line_user_id
  }
  return null
}

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

  const lineUserId = await getLineUserId(phone) || process.env.LINE_USER_ID

  if (lineUserId) {
    pushMessage(lineUserId, [
      {
        type: 'text',
        text: `🔐 รหัส OTP ของคุณคือ ${otp}\n\nรหัสนี้ใช้ได้ 5 นาที\n\n*ถ้าไม่ได้ขอรหัส ให้เพิกเฉยได้เลย`,
      },
    ])
  }

  const isDirect = !!(await getLineUserId(phone))
  return NextResponse.json({
    success: true,
    message: isDirect ? 'ส่ง OTP ทาง LINE แล้ว' : 'ส่ง OTP ทาง LINE ของ admin แล้ว',
    direct: isDirect,
  })
}
