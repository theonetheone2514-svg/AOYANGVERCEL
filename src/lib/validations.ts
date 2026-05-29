import { z } from 'zod'
import { NextResponse } from 'next/server'

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: Response } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { success: false as const, error: NextResponse.json({ error: firstIssue.message }, { status: 400 }) }
  }
  return { success: true as const, data: result.data as T }
}

export const orderItemSchema = z.object({
  menu_id: z.string().uuid('รูปแบบ menu_id ไม่ถูกต้อง'),
  name: z.string().min(1, 'กรุณาระบุชื่อเมนู'),
  price: z.number().positive('ราคาต้องมากกว่า 0'),
  qty: z.number().int().positive('จำนวนต้องมากกว่า 0'),
})

export const createOrderSchema = z.object({
  store_id: z.string().min(1, 'กรุณาระบุร้านค้า'),
  items: z.array(orderItemSchema).min(1, 'กรุณาเลือกเมนูอย่างน้อย 1 รายการ'),
  delivery_fee: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  payment_method: z.enum(['cash', 'transfer']).optional(),
  idempotency_key: z.string().optional(),
})

export const updateOrderSchema = z.object({
  status: z.enum(['รอดำเนินการ', 'กำลังเตรียมอาหาร', 'พร้อมจัดส่ง', 'กำลังจัดส่ง', 'จัดส่งสำเร็จ', 'ยกเลิก']).optional(),
  rider_id: z.string().uuid().optional(),
}).refine(d => d.status || d.rider_id, { message: 'กรุณาระบุข้อมูลที่จะอัปเดต' })

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^0\d{9}$/, 'เบอร์โทรไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 จำนวน 10 หลัก)'),
})

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^0\d{9}$/, 'เบอร์โทรไม่ถูกต้อง'),
  otp: z.string().regex(/^\d{6}$/, 'OTP ต้องเป็นตัวเลข 6 หลัก'),
})

export const registerSchema = z.object({
  phone: z.string().regex(/^0\d{9}$/, 'เบอร์โทรไม่ถูกต้อง'),
  otp: z.string().regex(/^\d{6}$/, 'OTP ต้องเป็นตัวเลข 6 หลัก'),
  role: z.enum(['merchant', 'rider'], { message: 'บทบาทไม่ถูกต้อง' }),
  name: z.string().min(1, 'กรุณากรอกชื่อ').optional(),
}).refine(d => {
  if (d.role === 'merchant' || d.role === 'rider') return !!d.name
  return true
}, { message: 'กรุณากรอกชื่อ' })

export const createMenuItemSchema = z.object({
  store_id: z.string().min(1, 'กรุณาระบุร้านค้า'),
  name: z.string().min(1, 'กรุณากรอกชื่อเมนู'),
  price: z.number().positive('ราคาต้องมากกว่า 0'),
  category: z.string().optional(),
  stock: z.number().int().min(0, 'สต็อกต้องไม่ติดลบ').optional(),
  image_url: z.string().url().optional(),
})

export const createStoreSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อร้าน'),
  phone: z.string().regex(/^0\d{9}$/, 'เบอร์โทรไม่ถูกต้อง'),
  status: z.enum(['open', 'closed']).optional(),
  wait_time: z.number().int().min(5).max(120).optional(),
  image_url: z.string().url().optional(),
})

export const searchSchema = z.string().max(100, 'คำค้นหายาวเกินไป').transform(s =>
  s.replace(/[<>"'&]/g, '').trim().slice(0, 100)
)

const phoneSchema = z.string().regex(/^0\d{9}$/, 'เบอร์โทรไม่ถูกต้อง')

export const updateStoreSchema = z.object({
  name: z.string().min(1).optional(),
  phone: phoneSchema.optional(),
  status: z.enum(['open', 'closed']).optional(),
  wait_time: z.number().int().min(5).max(120).optional(),
  image_url: z.string().url().optional(),
  line_user_id: z.string().optional(),
})

export const updateRiderSchema = z.object({
  name: z.string().min(1).optional(),
  phone: phoneSchema.optional(),
  status: z.enum(['available', 'busy', 'offline']).optional(),
  line_user_id: z.string().optional(),
})

export const createCustomerSchema = z.object({
  phone: phoneSchema,
  name: z.string().optional(),
  points: z.number().int().min(0).optional(),
})

export const updatePointsSchema = z.object({
  customer_id: z.string().min(1, 'กรุณาระบุลูกค้า'),
  points: z.number().int('คะแนนต้องเป็นตัวเลข'),
})

export const createRiderSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
})

export const updateSettingsSchema = z.record(z.string(), z.unknown())

export const lineLinkSchema = z.object({
  line_user_id: z.string().min(1, 'กรุณาระบุ LINE userId'),
})

export const orderIdSchema = z.object({
  order_id: z.string().uuid('รูปแบบ order_id ไม่ถูกต้อง'),
})
