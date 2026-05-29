import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/api-utils'
import { validate, createMenuItemSchema } from '@/lib/validations'

export const PATCH = withAuth(async (request: Request, session, params) => {
  const { id } = params!
  const body = await request.json()
  const parsed = validate(createMenuItemSchema.partial(), body)
  if (!parsed.success) return parsed.error

  const admin = getSupabaseAdmin()

  const { data: item } = await admin.from('menu_items').select('store_id').eq('id', id).single()
  if (!item) return NextResponse.json({ error: 'ไม่พบเมนู' }, { status: 404 })

  const { data: store } = await admin.from('stores').select('phone').eq('id', item.store_id).single()
  if (session.user_type !== 'admin' && store?.phone !== session.phone) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }

  const { data, error } = await admin.from('menu_items').update(parsed.data).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})

export const DELETE = withAuth(async (request: Request, session, params) => {
  const { id } = params!

  const admin = getSupabaseAdmin()

  const { data: item } = await admin.from('menu_items').select('store_id').eq('id', id).single()
  if (!item) return NextResponse.json({ error: 'ไม่พบเมนู' }, { status: 404 })

  const { data: store } = await admin.from('stores').select('phone').eq('id', item.store_id).single()
  if (session.user_type !== 'admin' && store?.phone !== session.phone) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }

  const { error } = await admin.from('menu_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})
