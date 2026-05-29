import { type NextRequest, NextResponse } from 'next/server'

const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/callback',
  '/api/auth',
  '/api/menu',
  '/api/stores',
  '/api/zones',
  '/api/settings',
  '/api/line',
]

const roleAccess: Record<string, string[]> = {
  '/merchant': ['merchant'],
  '/rider': ['rider'],
  '/admin': ['admin'],
  '/dashboard': ['admin', 'merchant'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.json' ||
    pathname === '/icon.svg'

  if (isPublic) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session_token')?.value

  if (!token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Validate session via Supabase REST API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/sessions?token=eq.${encodeURIComponent(token)}&expires_at=gte.${encodeURIComponent(new Date().toISOString())}&select=user_type,user_id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    const sessions = await res.json()
    const session = sessions?.[0]

    if (!session) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.set('session_token', '', { maxAge: 0 })
      return response
    }

    // Check role access
    const requiredRoles = Object.entries(roleAccess).find(([prefix]) =>
      pathname === prefix || pathname.startsWith(prefix + '/')
    )?.[1]

    if (requiredRoles && !requiredRoles.includes(session.user_type)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
