import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'x-csrf-token'

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

export function getCsrfCookieHeaders(token: string): Record<string, string> {
  return {
    'Set-Cookie': `${CSRF_COOKIE}=${token}; SameSite=Strict; Path=/; Max-Age=86400; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`,
  }
}

export function getCsrfTokenFromCookie(cookieString: string | null): string | null {
  if (!cookieString) return null
  for (const part of cookieString.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === CSRF_COOKIE) return rest.join('=')
  }
  return null
}

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
    'https://xn--12cbg6jme3a1d5d.com',
    'http://localhost:3000',
  ].filter(Boolean) as string[]

  if (origin && !allowedOrigins.some(a => origin === a || origin.endsWith('/' + a))) {
    return false
  }
  if (!origin && referer) {
    try {
      const refOrigin = new URL(referer).origin
      if (!allowedOrigins.some(a => refOrigin === a || refOrigin.endsWith('/' + a))) {
        return false
      }
    } catch {
      return false
    }
  }
  return true
}

export function csrfError(): NextResponse {
  return NextResponse.json({ error: 'CSRF token ไม่ถูกต้อง' }, { status: 403 })
}

export function originError(): NextResponse {
  return NextResponse.json({ error: 'ต้นทางคำขอไม่ถูกต้อง' }, { status: 403 })
}

export function validateCsrfToken(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie')
  const tokenCookie = getCsrfTokenFromCookie(cookieHeader)
  const tokenHeader = request.headers.get(CSRF_HEADER)
  if (!tokenCookie || !tokenHeader) return false
  return createHash('sha256').update(tokenCookie).digest('hex') === createHash('sha256').update(tokenHeader).digest('hex')
}
