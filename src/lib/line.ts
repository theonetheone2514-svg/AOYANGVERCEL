import { getSupabaseAdmin } from './supabase-admin'

const LINE_API = 'https://api.line.me/v2/bot/message'

function getAuthHeaders() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN not set')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export async function replyMessage(replyToken: string, messages: LineMessage[]) {
  try {
    const res = await fetch(`${LINE_API}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ replyToken, messages }),
    })
    if (!res.ok) {
      console.error(JSON.stringify({ level: 'error', message: 'LINE reply failed', status: res.status, timestamp: new Date().toISOString() }))
    }
  } catch (e) {
    console.error(JSON.stringify({ level: 'error', message: 'LINE reply error', error: String(e), timestamp: new Date().toISOString() }))
  }
}

export async function pushMessage(to: string, messages: LineMessage[]) {
  try {
    const res = await fetch(`${LINE_API}/push`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ to, messages }),
    })
    if (!res.ok) {
      console.error(JSON.stringify({ level: 'error', message: 'LINE push failed', status: res.status, to, timestamp: new Date().toISOString() }))
    }
  } catch (e) {
    console.error(JSON.stringify({ level: 'error', message: 'LINE push error', error: String(e), timestamp: new Date().toISOString() }))
  }
}

export async function pushToStore(storeId: string, messages: LineMessage[]) {
  const { data } = await getSupabaseAdmin()
    .from('stores')
    .select('line_user_id, name')
    .eq('id', storeId)
    .single()
  if (data?.line_user_id) {
    await pushMessage(data.line_user_id, messages)
  }
}

export async function pushToRider(riderId: string, messages: LineMessage[]) {
  const { data } = await getSupabaseAdmin()
    .from('riders')
    .select('line_user_id')
    .eq('id', riderId)
    .single()
  if (data?.line_user_id) {
    await pushMessage(data.line_user_id, messages)
  }
}

export async function pushToCustomer(customerId: string, messages: LineMessage[]) {
  const { data } = await getSupabaseAdmin()
    .from('customers')
    .select('line_user_id')
    .eq('id', customerId)
    .single()
  if (data?.line_user_id) {
    await pushMessage(data.line_user_id, messages)
  }
}

export interface LineMessage {
  type: string
  [key: string]: unknown
}

export function textMessage(text: string): LineMessage {
  return { type: 'text', text }
}

export function flexMessage(altText: string, contents: FlexBubble | FlexCarousel): LineMessage {
  return {
    type: 'flex',
    altText,
    contents,
  }
}

interface FlexBubble {
  type: 'bubble'
  header?: FlexBox
  body?: FlexBox
  footer?: FlexBox
}

interface FlexCarousel {
  type: 'carousel'
  contents: FlexBubble[]
}

interface FlexBox {
  type: 'box'
  layout: 'horizontal' | 'vertical' | 'baseline'
  contents: FlexComponent[]
  [key: string]: unknown
}

type FlexComponent = {
  type: string
  [key: string]: unknown
}

export function storeListFlex(stores: { id: string; name: string; status: string; wait_time?: number }[]): LineMessage {
  const bubbles: FlexBubble[] = stores.map((store) => ({
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: store.name, weight: 'bold', size: 'md' },
        {
          type: 'text',
          text: store.status === 'open' ? `🟢 เปิด • รอ ~${store.wait_time || 20} นาที` : '🔴 ปิด',
          size: 'sm',
          color: store.status === 'open' ? '#00a000' : '#ff0000',
        },
      ],
    },
    footer: store.status === 'open' ? {
      type: 'box',
      layout: 'vertical',
      contents: [{
        type: 'button',
        action: { type: 'message', label: 'ดูเมนู', text: `เมนู ${store.id}` },
        style: 'primary',
        color: '#E65100',
      }],
    } : undefined,
  }))

  return {
    type: 'flex',
    altText: 'รายชื่อร้านค้า',
    contents: { type: 'carousel', contents: bubbles },
  }
}

export function menuFlex(items: { id: string; name: string; price: number; category?: string }[]): LineMessage {
  const bubbles: FlexBubble[] = items.map((item) => ({
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: item.name, weight: 'bold', size: 'md' },
        { type: 'text', text: `${item.price} บาท`, size: 'lg', color: '#E65100', weight: 'bold' },
        ...(item.category ? [{ type: 'text', text: item.category, size: 'xs', color: '#999' } as FlexComponent] : []),
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [{
        type: 'button',
        action: { type: 'message', label: 'เพิ่ม', text: `+${item.name}` },
        style: 'primary',
        color: '#E65100',
      }],
    },
  }))

  return {
    type: 'flex',
    altText: 'เมนูอาหาร',
    contents: { type: 'carousel', contents: bubbles },
  }
}

export function cartFlex(items: { name: string; qty: number; price: number }[], total: number): LineMessage {
  const itemLines = items.map((item) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: `${item.name} x${item.qty}`, flex: 1 },
      { type: 'text', text: `${item.price * item.qty} บาท`, color: '#E65100', align: 'end' as const },
    ],
  }))

  return {
    type: 'flex',
    altText: 'ตะกร้าสินค้า',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [{ type: 'text', text: '🛒 ตะกร้าสินค้า', weight: 'bold', size: 'lg' }],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          ...itemLines,
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'รวม', weight: 'bold' },
              { type: 'text', text: `${total} บาท`, weight: 'bold', color: '#E65100', align: 'end' },
            ],
            margin: 'md',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          action: { type: 'message', label: '📦 สั่งเลย', text: 'ยืนยันสั่งอาหาร' },
          style: 'primary',
          color: '#E65100',
        }],
      },
    },
  }
}

export function helpMessage(): LineMessage {
  return textMessage(
    '🔰 วิธีใช้ LINE Bot\n━━━━━━━━━━━━━━\n' +
    '• "สมัคร 092XXXXXXX" — ลงทะเบียนสมาชิก\n' +
    '• "ผูก 092XXXXXXX" — ผูก LINE กับเบอร์\n' +
    '• "เลิกผูก" — เลิกผูก LINE\n' +
    '• "เมนู" — ดูร้านค้าทั้งหมด\n' +
    '• "ร้าน [ชื่อ]" — ดูเมนูของร้าน\n' +
    '• "+[ชื่อเมนู]" — เพิ่มในตะกร้า\n' +
    '• "ตะกร้า" — ดูตะกร้าสินค้า\n' +
    '• "สั่ง" — สั่งอาหาร (ระบุที่อยู่ก่อน)\n' +
    '• "สถานะ [เลขออเดอร์]" — เช็คสถานะ\n' +
    '• "ช่วยเหลือ" — ดูวิธีใช้\n' +
    '━━━━━━━━━━━━━━\n#เอาหยังบ่'
  )
}
