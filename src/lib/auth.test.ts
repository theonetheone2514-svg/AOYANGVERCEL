import { describe, it, expect } from 'vitest'
import { generateToken, generateOtp, hashOtp } from './auth'

describe('generateToken', () => {
  it('returns a valid base64url string', () => {
    const token = generateToken()
    expect(token).toMatch(/^[a-zA-Z0-9_-]+$/)
  })

  it('has sufficient entropy (at least 32 bytes = 43 base64url chars)', () => {
    const token = generateToken()
    expect(token.length).toBeGreaterThanOrEqual(43)
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

describe('hashOtp', () => {
  it('returns a sha256 hex hash', () => {
    const hash = hashOtp('0812345678', '123456')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('produces consistent hashes for same input', () => {
    const h1 = hashOtp('0812345678', '123456')
    const h2 = hashOtp('0812345678', '123456')
    expect(h1).toBe(h2)
  })

  it('produces different hashes for different OTPs', () => {
    const h1 = hashOtp('0812345678', '123456')
    const h2 = hashOtp('0812345678', '654321')
    expect(h1).not.toBe(h2)
  })

  it('produces different hashes for different phones', () => {
    const h1 = hashOtp('0812345678', '123456')
    const h2 = hashOtp('0899999999', '123456')
    expect(h1).not.toBe(h2)
  })
})
