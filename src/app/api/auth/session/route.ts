import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionFromToken } from '@/lib/auth'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value

  if (!token) {
    return NextResponse.json({ authenticated: false })
  }

  const session = await getSessionFromToken(token)
  if (!session) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      phone: session.phone,
      type: session.user_type,
      id: session.user_id,
    },
  })
}
