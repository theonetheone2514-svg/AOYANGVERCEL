import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/api-utils'

export const GET = withAuth(async (request: Request, session) => {
  const { searchParams } = new URL(request.url)
  const sessionId = session.user_id

  const requestedId = searchParams.get('id')

  if (requestedId && requestedId !== sessionId && session.user_type !== 'admin') {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }

  const admin = getSupabaseAdmin()
  const query = admin.from('customers').select('*')
  if (requestedId) {
    query.eq('id', requestedId)
  } else {
    query.eq('id', sessionId)
  }

  const { data, error } = await query.single()
  if (error) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 })
  return NextResponse.json(data)
})

export const POST = withAuth(async (request: Request) => {
  const body = await request.json()
  const { phone, name } = body

  if (!phone) return NextResponse.json({ error: 'กรุณากรอกเบอร์โทร' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('customers')
    .insert({ phone, name })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
})
