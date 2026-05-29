import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/api-utils'
import { validate, createMenuItemSchema } from '@/lib/validations'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('store_id')

  let query = supabase.from('menu_items').select('*').order('name')
  if (storeId) query = query.eq('store_id', storeId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export const POST = withAuth(async (request: Request, session) => {
  const body = await request.json()
  const parsed = validate(createMenuItemSchema, body)
  if (parsed.error) return parsed.error

  const admin = getSupabaseAdmin()

  const { data: store } = await admin.from('stores').select('phone').eq('id', parsed.data.store_id).single()
  if (session.user_type !== 'admin' && store?.phone !== session.phone) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }

  const { data, error } = await admin.from('menu_items').insert(parsed.data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
})
