import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { pushMessage, textMessage } from '@/lib/line'
import { withAuth } from '@/lib/api-utils'

export const PATCH = withAuth(async (request: Request, session, params) => {
  const { id } = params!
  const body = await request.json()

  const { data, error } = await supabase
    .from('orders').update(body).eq('id', id).select('*, items:order_items(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.status && process.env.LINE_USER_ID) {
    const itemsText = (data.items || []).map((i: any) => `  ${i.qty}x ${i.name}`).join('\n')
    const statusEmoji: Record<string, string> = {
      'รอดำเนินการ': '📋', 'กำลังเตรียมอาหาร': '👨‍🍳', 'พร้อมจัดส่ง': '📦',
      'กำลังจัดส่ง': '🛵', 'จัดส่งสำเร็จ': '✅', 'ยกเลิก': '❌',
    }
    pushMessage(process.env.LINE_USER_ID, [
      textMessage(
        `${statusEmoji[body.status] || '📋'} อัปเดตออเดอร์\n━━━━━━━━━━━━━━\nเลขที่: #${id.slice(0, 8)}\nสถานะ: ${body.status}\n━━━━━━━━━━━━━━\n${itemsText}\n💵 รวม: ${data.total} บาท\n━━━━━━━━━━━━━━`
      ),
    ])
  }

  return NextResponse.json(data)
}, ['merchant', 'rider', 'admin'])

export const GET = withAuth(async (request: Request, session, params) => {
  const { id } = params!

  const { data, error } = await supabase
    .from('orders').select('*, items:order_items(*)').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 })
  return NextResponse.json(data)
})
