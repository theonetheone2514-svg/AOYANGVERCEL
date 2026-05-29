import { describe, it, expect } from 'vitest'
import { sendOtpSchema, verifyOtpSchema, registerSchema, createOrderSchema, createMenuItemSchema, createStoreSchema, updateOrderSchema } from './validations'

describe('sendOtpSchema', () => {
  it('accepts valid Thai phone number', () => {
    expect(sendOtpSchema.safeParse({ phone: '0812345678' }).success).toBe(true)
  })

  it('rejects phone without leading 0', () => {
    expect(sendOtpSchema.safeParse({ phone: '812345678' }).success).toBe(false)
  })

  it('rejects short phone number', () => {
    expect(sendOtpSchema.safeParse({ phone: '081234567' }).success).toBe(false)
  })

  it('rejects empty phone', () => {
    expect(sendOtpSchema.safeParse({ phone: '' }).success).toBe(false)
  })
})

describe('verifyOtpSchema', () => {
  it('accepts valid phone + 6-digit OTP', () => {
    expect(verifyOtpSchema.safeParse({ phone: '0812345678', otp: '123456' }).success).toBe(true)
  })

  it('rejects OTP with letters', () => {
    expect(verifyOtpSchema.safeParse({ phone: '0812345678', otp: 'abc123' }).success).toBe(false)
  })

  it('rejects short OTP', () => {
    expect(verifyOtpSchema.safeParse({ phone: '0812345678', otp: '12345' }).success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('accepts merchant registration with name', () => {
    expect(registerSchema.safeParse({ phone: '0812345678', otp: '123456', role: 'merchant', name: 'ร้านข้าว' }).success).toBe(true)
  })

  it('accepts rider registration with name', () => {
    expect(registerSchema.safeParse({ phone: '0812345678', otp: '123456', role: 'rider', name: 'สมชาย' }).success).toBe(true)
  })

  it('rejects merchant without name', () => {
    const result = registerSchema.safeParse({ phone: '0812345678', otp: '123456', role: 'merchant' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid role', () => {
    expect(registerSchema.safeParse({ phone: '0812345678', otp: '123456', role: 'customer' }).success).toBe(false)
  })
})

describe('createOrderSchema', () => {
  const validItem = { menu_id: '550e8400-e29b-41d4-a716-446655440000', name: 'ข้าวผัด', price: 50, qty: 1 }

  it('accepts valid order', () => {
    expect(createOrderSchema.safeParse({ store_id: 'S01', items: [validItem] }).success).toBe(true)
  })

  it('rejects empty items', () => {
    expect(createOrderSchema.safeParse({ store_id: 'S01', items: [] }).success).toBe(false)
  })

  it('rejects negative price', () => {
    expect(createOrderSchema.safeParse({ store_id: 'S01', items: [{ ...validItem, price: -10 }] }).success).toBe(false)
  })

  it('rejects non-UUID menu_id', () => {
    expect(createOrderSchema.safeParse({ store_id: 'S01', items: [{ ...validItem, menu_id: 'not-a-uuid' }] }).success).toBe(false)
  })

  it('accepts optional payment_method', () => {
    expect(createOrderSchema.safeParse({ store_id: 'S01', items: [validItem], payment_method: 'transfer' }).success).toBe(true)
  })

  it('rejects invalid payment_method', () => {
    expect(createOrderSchema.safeParse({ store_id: 'S01', items: [validItem], payment_method: 'credit' }).success).toBe(false)
  })
})

describe('updateOrderSchema', () => {
  it('accepts status update', () => {
    expect(updateOrderSchema.safeParse({ status: 'กำลังเตรียมอาหาร' }).success).toBe(true)
  })

  it('accepts rider assignment', () => {
    expect(updateOrderSchema.safeParse({ rider_id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true)
  })

  it('rejects empty body', () => {
    expect(updateOrderSchema.safeParse({}).success).toBe(false)
  })

  it('rejects invalid status', () => {
    expect(updateOrderSchema.safeParse({ status: 'invalid' }).success).toBe(false)
  })
})

describe('createMenuItemSchema', () => {
  it('accepts valid menu item', () => {
    expect(createMenuItemSchema.safeParse({ store_id: 'S01', name: 'ข้าวผัด', price: 50 }).success).toBe(true)
  })

  it('rejects negative stock', () => {
    expect(createMenuItemSchema.safeParse({ store_id: 'S01', name: 'ข้าวผัด', price: 50, stock: -1 }).success).toBe(false)
  })

  it('rejects zero price', () => {
    expect(createMenuItemSchema.safeParse({ store_id: 'S01', name: 'ฟรี', price: 0 }).success).toBe(false)
  })
})

describe('createStoreSchema', () => {
  it('accepts valid store', () => {
    expect(createStoreSchema.safeParse({ name: 'ร้านข้าว', phone: '0812345678' }).success).toBe(true)
  })

  it('rejects invalid wait_time range', () => {
    expect(createStoreSchema.safeParse({ name: 'ร้านข้าว', phone: '0812345678', wait_time: 200 }).success).toBe(false)
  })
})
