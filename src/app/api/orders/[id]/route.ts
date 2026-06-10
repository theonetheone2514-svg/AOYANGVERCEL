import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { pushMessage, textMessage } from '@/lib/line'
import { withAuth } from '@/lib/api-utils'
import { validate, updateOrderSchema } from '@/lib/validations'

const STATUS_EMOJI: Record<string, string> = {
  'รอดำเนินการ': '📋', 'กำลังเตรียมอาหาร': '👨‍🍳', 'พร้อมจัดส่ง': '📦',
  'กำลังจัดส่ง': '🛵', 'จัดส่งสำเร็จ': '✅', 'ยกเลิก': '❌',
}

async function notifyCustomerOnStatusChange(order: any, newStatus: string) {
  if (!order.customer_id) return
  const admin = getSupabaseAdmin()
  const { data: customer } = await admin
    .from('customers').select('line_user_id').eq('id', order.customer_id).single()
  if (!customer?.line_user_id) return

  const itemsText = (order.items || []).map((i: any) => `  ${i.qty}x ${i.name}`).join('\n')
  pushMessage(customer.line_user_id, [
    textMessage(
      `${STATUS_EMOJI[newStatus] || '📋'} อัปเดตออเดอร์\n━━━━━━━━━━━━━━\nเลขที่: #${order.id.slice(0, 8)}\nสถานะ: ${newStatus}\n━━━━━━━━━━━━━━\n${itemsText}\n💵 รวม: ${order.total} บาท\n━━━━━━━━━━━━━━`
    ),
  ])
}

async function notifyAdminOnStatusChange(order: any, newStatus: string) {
  if (!process.env.LINE_USER_ID) return
  const itemsText = (order.items || []).map((i: any) => `  ${i.qty}x ${i.name}`).join('\n')
  pushMessage(process.env.LINE_USER_ID, [
    textMessage(
      `${STATUS_EMOJI[newStatus] || '📋'} อัปเดตออเดอร์\n━━━━━━━━━━━━━━\nเลขที่: #${order.id.slice(0, 8)}\nสถานะ: ${newStatus}\n━━━━━━━━━━━━━━\n${itemsText}\n💵 รวม: ${order.total} บาท\n━━━━━━━━━━━━━━`
    ),
  ])
}

export const PATCH = withAuth(async (request: Request, session, params) => {
  const { id } = params!
  const body = await request.json()
  const validated = validate(updateOrderSchema, body)
  if (!validated.success) return validated.error

  const admin = getSupabaseAdmin()

  if (body.status === 'ยกเลิก') {
    const { data, error } = await admin.rpc('cancel_order', {
      p_order_id: id,
      p_caller_id: session.user_id,
      p_caller_type: session.user_type,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (data.ok === false) {
      const status = data.error === 'ไม่พบออเดอร์' ? 404 : 409
      return NextResponse.json({ error: data.error }, { status })
    }

    const { data: order } = await admin
      .from('orders').select('*, items:order_items(*)').eq('id', id).single()

    await Promise.all([
      notifyCustomerOnStatusChange(order, 'ยกเลิก'),
      notifyAdminOnStatusChange(order, 'ยกเลิก'),
    ])

    return NextResponse.json(order)
  }

  const { data: existingOrder } = await admin.from('orders').select('store_id, rider_id, customer_id').eq('id', id).single()
  if (!existingOrder) return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 })

  if (session.user_type === 'merchant' && existingOrder.store_id !== session.user_id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
  }
  if (session.user_type === 'rider' && existingOrder.rider_id !== session.user_id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('orders').update(body).eq('id', id).select('*, items:order_items(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.status) {
    await Promise.all([
      notifyCustomerOnStatusChange(data, body.status),
      notifyAdminOnStatusChange(data, body.status),
    ])
  }

  return NextResponse.json(data)
}, ['merchant', 'rider', 'admin'])

export const GET = withAuth(async (request: Request, session, params) => {
  const { id } = params!

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('orders').select('*, items:order_items(*)').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 })

  if (session.user_type === 'customer' && data.customer_id !== session.user_id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }
  if (session.user_type === 'merchant') {
    const { data: store } = await admin.from('stores').select('id').eq('user_id', session.user_id).single()
    if (!store || store.id !== data.store_id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
    }
  }
  if (session.user_type === 'rider' && data.rider_id !== session.user_id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }

  return NextResponse.json(data)
})
