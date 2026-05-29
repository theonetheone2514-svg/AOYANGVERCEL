import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { pushMessage, pushToStore, pushToCustomer, textMessage } from '@/lib/line'
import { withAuth } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { validate, orderIdSchema } from '@/lib/validations'

export const POST = withAuth(async (request: Request, session) => {
  const limit = await checkRateLimit(`rider-accept:${session.user_id}`, { maxRequests: 10, windowMs: 60_000 })
  if (limit) return limit
  const body = await request.json()
  const parsed = validate(orderIdSchema, body)
  if (!parsed.success) return parsed.error

  const admin = getSupabaseAdmin()

  const { data, error } = await admin.rpc('accept_order', {
    p_order_id: parsed.data.order_id,
    p_rider_id: session.user_id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data.ok === false) {
    const status = data.error === 'ไม่พบออเดอร์' ? 404 : 409
    return NextResponse.json({ error: data.error }, { status })
  }

  const { data: order } = await admin
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', parsed.data.order_id)
    .single()

  if (order) {
    const itemsText = (order.items || []).map((i: any) =>
      `  ${i.qty}x ${i.name}`
    ).join('\n')
    const riderName = session.phone

    pushToStore(order.store_id, [textMessage(
      `🛵 มีไรเดอร์รับงานแล้ว!\n━━━━━━━━━━━━━━\n📋 ออเดอร์ #${order.id.slice(0, 8)}\n🛵 ไรเดอร์: ${riderName}\n📝 รายการ:\n${itemsText}\n━━━━━━━━━━━━━━`
    )])

    pushToCustomer(order.customer_id, [textMessage(
      `🛵 ไรเดอร์กำลังไปส่ง!\n━━━━━━━━━━━━━━\n📋 ออเดอร์ #${order.id.slice(0, 8)}\n📝 รายการ:\n${itemsText}\n💵 รวม: ${order.total} บาท\n━━━━━━━━━━━━━━`
    )])
  }

  if (process.env.LINE_USER_ID) {
    const itemsText = (order?.items || []).map((i: any) =>
      `  ${i.qty}x ${i.name}`
    ).join('\n')
    pushMessage(process.env.LINE_USER_ID, [textMessage(
      `🛵 ไรเดอร์รับงาน!\n━━━━━━━━━━━━━━\n📋 ออเดอร์ #${order?.id?.slice(0, 8)}\n🛵 ไรเดอร์: ${session.phone}\n📝 รายการ:\n${itemsText}\n━━━━━━━━━━━━━━`
    )])
  }

  return NextResponse.json(order)
}, ['rider'])
