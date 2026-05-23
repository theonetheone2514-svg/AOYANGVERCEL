import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('stores').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
