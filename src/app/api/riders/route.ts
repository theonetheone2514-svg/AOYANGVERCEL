import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const id = searchParams.get('id')

  let data: unknown
  let error: unknown

  if (phone) {
    const result = await supabase.from('riders').select('*').eq('phone', phone).single()
    data = result.data
    error = result.error
  } else if (id) {
    const result = await supabase.from('riders').select('*').eq('id', id).single()
    data = result.data
    error = result.error
  } else {
    const result = await supabase.from('riders').select('*').order('name')
    data = result.data
    error = result.error
  }

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
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
}
