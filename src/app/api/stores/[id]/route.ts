import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/api-utils'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: store, error: storeError } = await supabase
    .from('stores').select('*').eq('id', id).single()
  if (storeError) return NextResponse.json({ error: storeError.message }, { status: 500 })
  if (!store) return NextResponse.json({ error: 'ไม่พบร้านค้า' }, { status: 404 })

  const { data: menu } = await supabase
    .from('menu_items').select('*').eq('store_id', id).order('name')

  return NextResponse.json({ ...store, menu_items: menu || [] })
}

export const PATCH = withAuth(async (request: Request, session, params) => {
  const { id } = params!
  if (session.user_type !== 'admin' && session.user_id !== id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }

  const body = await request.json()
  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from('stores').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})

export const DELETE = withAuth(async (request: Request, session, params) => {
  const { id } = params!
  if (session.user_type !== 'admin') {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }

  const admin = getSupabaseAdmin()

  const { count: orderCount } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', id)

  if (orderCount && orderCount > 0) {
    return NextResponse.json({
      error: `ไม่สามารถลบได้ เนื่องจากร้านค้ามีออเดอร์อยู่ ${orderCount} รายการ`,
      orderCount,
    }, { status: 400 })
  }

  const { error } = await admin.from('stores').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}, ['admin'])
