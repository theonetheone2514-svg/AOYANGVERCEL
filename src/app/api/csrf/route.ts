import { NextResponse } from 'next/server'
import { generateCsrfToken, getCsrfCookieHeaders } from '@/lib/csrf'

export async function GET() {
  const token = generateCsrfToken()
  const response = NextResponse.json({ token })
  const headers = getCsrfCookieHeaders(token)
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}
