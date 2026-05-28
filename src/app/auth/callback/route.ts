import { NextResponse } from 'next/server'

const allowedPaths = ['/', '/merchant', '/rider', '/admin', '/dashboard', '/orders', '/about']

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const redirectTo = searchParams.get('redirect') || '/'

  try {
    const url = new URL(redirectTo, origin)
    if (!allowedPaths.includes(url.pathname) && !url.pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/', origin))
    }
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.redirect(new URL('/', origin))
  }
}
