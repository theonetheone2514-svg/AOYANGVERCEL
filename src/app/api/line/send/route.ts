import { NextResponse } from 'next/server'

function formatNewOrder(body: any): string {
  const items = (body.items || [])
    .map((i: any) => `  ${i.qty}x ${i.name} = ${i.price * i.qty} บาท`)
    .join('\n')

  return `🍳 มีออเดอร์ใหม่!\n━━━━━━━━━━━━━━\n🏪 ร้าน: ${body.store_id}\n💰 ยอดรวม: ${body.total} บาท\n📝 รายการ:\n${items}\n${body.note ? `📌 หมายเหตุ: ${body.note}\n` : ''}📍 ที่อยู่: ${body.address || 'ระบุในแผนที่'}\n━━━━━━━━━━━━━━\n#เอาหยังบ่`
}

function formatStatusUpdate(body: any): string {
  return `📋 ออเดอร์ ${body.order_id}\nสถานะ: ${body.status}`
}

export async function POST(request: Request) {
  const body = await request.json()
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const lineUserId = process.env.LINE_USER_ID

  if (!lineToken || !lineUserId) {
    return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })
  }

  let text = ''
  if (body.type === 'new_order') {
    text = formatNewOrder(body)
  } else if (body.type === 'status_update') {
    text = formatStatusUpdate(body)
  } else {
    text = body.text || ''
  }

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lineToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
