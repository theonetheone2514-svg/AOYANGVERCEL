import { describe, it, expect } from 'vitest'
import { generateToken, generateOtp } from './auth'

describe('generateToken', () => {
  it('returns a 64-character string', () => {
    const token = generateToken()
    expect(token).toHaveLength(64)
  })

  it('contains only alphanumeric characters', () => {
    const token = generateToken()
    expect(token).toMatch(/^[a-zA-Z0-9]+$/)
  })

  it('produces unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()))
    expect(tokens.size).toBe(100)
  })
})

describe('generateOtp', () => {
  it('returns a 6-digit string', () => {
    const otp = generateOtp()
    expect(otp).toHaveLength(6)
  })

  it('contains only digits', () => {
    const otp = generateOtp()
    expect(otp).toMatch(/^\d{6}$/)
  })

  it('is within valid range', () => {
    for (let i = 0; i < 100; i++) {
      const otp = parseInt(generateOtp(), 10)
      expect(otp).toBeGreaterThanOrEqual(100000)
      expect(otp).toBeLessThanOrEqual(999999)
    }
  })
})
