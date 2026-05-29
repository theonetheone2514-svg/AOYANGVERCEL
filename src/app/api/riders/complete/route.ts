import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { pushMessage, pushToStore, pushToCustomer, textMessage } from '@/lib/line'
import { withAuth } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { validate, orderIdSchema } from '@/lib/validations'

export const POST = withAuth(async (request: Request, session) => {
  const limit = await checkRateLimit(`rider-complete:${session.user_id}`, { maxRequests: 10, windowMs: 60_000 })
  if (limit) return limit
  const body = await request.json()
  const parsed = validate(orderIdSchema, body)
  if (!parsed.success) return parsed.error

  const admin = getSupabaseAdmin()

  const { data, error } = await admin.rpc('complete_order', {
    p_order_id: parsed.data.order_id,
    p_rider_id: session.user_id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data.ok === false) {
    const status = data.error === 'ไม่พบออเดอร์' ? 404
      : data.error === 'ไม่ใช่งานของคุณ' ? 403
      : 409
    return NextResponse.json({ error: data.error }, { status })
  }

  const [updatedOrder, rider] = await Promise.all([
    admin.from('orders').select('*').eq('id', parsed.data.order_id).single(),
    admin.from('riders').select('*').eq('id', session.user_id).single(),
  ])

  const order = updatedOrder.data
  if (order) {
    pushToStore(order.store_id, [textMessage(
      `✅ จัดส่งสำเร็จ!\n━━━━━━━━━━━━━━\n📋 ออเดอร์ #${order.id.slice(0, 8)}\n💵 ยอดรวม: ${order.total} บาท\n━━━━━━━━━━━━━━`
    )])

    pushToCustomer(order.customer_id, [textMessage(
      `✅ อาหารถึงมือคุณแล้ว!\n━━━━━━━━━━━━━━\n📋 ออเดอร์ #${order.id.slice(0, 8)}\n💵 ยอดรวม: ${order.total} บาท\n━━━━━━━━━━━━━━\nขอบคุณที่ใช้บริการ 🙏`
    )])
  }

  if (process.env.LINE_USER_ID && order) {
    pushMessage(process.env.LINE_USER_ID, [textMessage(
      `✅ จัดส่งสำเร็จ\n━━━━━━━━━━━━━━\n📋 ออเดอร์ #${order.id.slice(0, 8)}\n💵 ยอดรวม: ${order.total} บาท\n━━━━━━━━━━━━━━`
    )])
  }

  return NextResponse.json({ order, rider: rider.data })
}, ['rider'])
