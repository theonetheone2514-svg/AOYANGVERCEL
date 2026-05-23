import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { pushMessage, textMessage } from '@/lib/line'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('orders').update(body).eq('id', id).select('*, items:order_items(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send LINE notification on status change
  if (body.status && process.env.LINE_USER_ID) {
    const itemsText = (data.items || []).map((i: any) => `  ${i.qty}x ${i.name}`).join('\n')
    pushMessage(process.env.LINE_USER_ID, [
      textMessage(`📋 อัปเดตออเดอร์ #${id.slice(0, 8)}\nสถานะ: ${body.status}\n━━━━━━━━━━━━━━\n${itemsText}\n💵 รวม: ${data.total} บาท\n━━━━━━━━━━━━━━`),
    ])
  }

  return NextResponse.json(data)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabase
    .from('orders').select('*, items:order_items(*)').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 })
  return NextResponse.json(data)
}
