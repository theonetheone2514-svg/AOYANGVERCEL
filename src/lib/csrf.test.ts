import { describe, it, expect } from 'vitest'
import {
  generateCsrfToken,
  getCsrfTokenFromCookie,
  validateCsrfToken,
  validateOrigin,
} from './csrf'

describe('generateCsrfToken', () => {
  it('returns a 64-character hex string', () => {
    const token = generateCsrfToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[a-f0-9]+$/)
  })

  it('produces unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateCsrfToken()))
    expect(tokens.size).toBe(100)
  })
})

describe('getCsrfTokenFromCookie', () => {
  it('extracts token from cookie string', () => {
    const cookie = 'csrf_token=abc123def456; session_token=xyz'
    expect(getCsrfTokenFromCookie(cookie)).toBe('abc123def456')
  })

  it('returns null for null input', () => {
    expect(getCsrfTokenFromCookie(null)).toBeNull()
  })

  it('returns null when csrf_token not present', () => {
    expect(getCsrfTokenFromCookie('session_token=xyz')).toBeNull()
  })

  it('handles token with equals signs', () => {
    const cookie = 'csrf_token=abc==; other=val'
    expect(getCsrfTokenFromCookie(cookie)).toBe('abc==')
  })
})

describe('validateCsrfToken', () => {
  it('returns true when cookie and header tokens match', () => {
    const token = 'test-token-value'
    const request = new Request('http://localhost/api/test', {
      headers: {
        cookie: `csrf_token=${token}`,
        'x-csrf-token': token,
      },
    })
    expect(validateCsrfToken(request)).toBe(true)
  })

  it('returns false when tokens differ', () => {
    const request = new Request('http://localhost/api/test', {
      headers: {
        cookie: 'csrf_token=token-a',
        'x-csrf-token': 'token-b',
      },
    })
    expect(validateCsrfToken(request)).toBe(false)
  })

  it('returns false when cookie is missing', () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-csrf-token': 'some-token' },
    })
    expect(validateCsrfToken(request)).toBe(false)
  })

  it('returns false when header is missing', () => {
    const request = new Request('http://localhost/api/test', {
      headers: { cookie: 'csrf_token=some-token' },
    })
    expect(validateCsrfToken(request)).toBe(false)
  })
})

describe('validateOrigin', () => {
  it('allows request with matching origin', () => {
    const original = process.env.NEXT_PUBLIC_SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
    const request = new Request('http://localhost/api/test', {
      headers: { origin: 'https://example.com' },
    })
    expect(validateOrigin(request)).toBe(true)
    process.env.NEXT_PUBLIC_SITE_URL = original
  })

  it('allows request with no origin (same-origin)', () => {
    const request = new Request('http://localhost/api/test')
    expect(validateOrigin(request)).toBe(true)
  })

  it('rejects request with mismatched origin', () => {
    const original = process.env.NEXT_PUBLIC_SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
    const request = new Request('http://localhost/api/test', {
      headers: { origin: 'https://evil.com' },
    })
    expect(validateOrigin(request)).toBe(false)
    process.env.NEXT_PUBLIC_SITE_URL = original
  })
})
