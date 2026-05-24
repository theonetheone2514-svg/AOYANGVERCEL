import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase.from('riders').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: 'ไม่พบไรเดอร์' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { data, error } = await supabase
    .from('riders').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Check for existing orders
  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('rider_id', id)

  if (orderCount && orderCount > 0) {
    return NextResponse.json({
      error: `ไม่สามารถลบได้ เนื่องจากไรเดอร์มีออเดอร์อยู่ ${orderCount} รายการ`,
      orderCount,
    }, { status: 400 })
  }

  const { error } = await supabase.from('riders').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
