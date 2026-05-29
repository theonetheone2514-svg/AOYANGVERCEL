import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/api-utils'
import { validate, createRiderSchema } from '@/lib/validations'

export const GET = withAuth(async (request: Request, session) => {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const id = searchParams.get('id')

  if (session.user_type !== 'admin') {
    if (id && id !== session.user_id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
    }
    if (phone && phone !== session.phone) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
    }
    if (!phone && !id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
    }
  }

  const admin = getSupabaseAdmin()
  let result: { data: unknown; error: unknown } | null = null

  if (phone) {
    result = await admin.from('riders').select('*').eq('phone', phone).single()
  } else if (id) {
    result = await admin.from('riders').select('*').eq('id', id).single()
  } else {
    result = await admin.from('riders').select('*').order('name')
  }

  const data = result?.data
  const err = result?.error

  if (err) return NextResponse.json({ error: String(err) }, { status: 500 })
  return NextResponse.json(data)
})

export const POST = withAuth(async (request: Request) => {
  const body = await request.json()
  const parsed = validate(createRiderSchema, body)
  if (parsed.error) return parsed.error

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('riders')
    .insert({ ...parsed.data, earnings: 0, jobs_count: 0, online: false })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
})
