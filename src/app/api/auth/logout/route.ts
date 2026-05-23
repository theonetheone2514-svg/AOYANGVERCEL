import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { destroySession, getLogoutCookieHeaders } from '@/lib/auth'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value

  if (token) {
    await destroySession(token)
  }

  const response = NextResponse.json({ success: true })
  const headers = getLogoutCookieHeaders()
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }

  return response
}
