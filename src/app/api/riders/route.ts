import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'

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

  let result: { data: unknown; error: unknown } | null = null

  if (phone) {
    result = await supabase.from('riders').select('*').eq('phone', phone).single()
  } else if (id) {
    result = await supabase.from('riders').select('*').eq('id', id).single()
  } else {
    result = await supabase.from('riders').select('*').order('name')
  }

  const data = result?.data
  const err = result?.error

  if (err) return NextResponse.json({ error: String(err) }, { status: 500 })
  return NextResponse.json(data)
})

export const POST = withAuth(async (request: Request) => {
  const body = await request.json()
  const { phone, name } = body

  if (!phone) return NextResponse.json({ error: 'กรุณากรอกเบอร์โทร' }, { status: 400 })

  const { data, error } = await supabase
    .from('riders')
    .insert({ phone, name, earnings: 0, jobs_count: 0, online: false })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
})
