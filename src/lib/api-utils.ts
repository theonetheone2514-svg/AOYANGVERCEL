import { NextResponse } from 'next/server'
import { requireAuth, AuthError, type UserType } from './auth'
import { validateOrigin, validateCsrfToken, originError, csrfError } from './csrf'

export type ApiHandler = (
  req: Request,
  session: Awaited<ReturnType<typeof requireAuth>>,
  params?: Record<string, string>
) => Promise<Response>

function isMutationMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
}

export function withAuth(handler: ApiHandler, allowedRoles?: UserType[]) {
  return async (req: Request, context?: { params?: Promise<Record<string, string>> }) => {
    try {
      if (isMutationMethod(req.method)) {
        if (!validateOrigin(req)) return originError()
        if (!validateCsrfToken(req)) return csrfError()
      }

      const session = await requireAuth(allowedRoles)
      const params = context?.params ? await context.params : undefined
      return handler(req, session, params)
    } catch (e) {
      if (e instanceof AuthError) {
        return NextResponse.json({ error: e.message }, { status: e.status })
      }
      const msg = e instanceof Error ? e.message : 'Unknown error'
      console.error(JSON.stringify({ level: 'error', message: msg, timestamp: new Date().toISOString() }))
      return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 })
    }
  }
}
