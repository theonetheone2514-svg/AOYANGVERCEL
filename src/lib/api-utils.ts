import { NextResponse } from 'next/server'
import { requireAuth, AuthError, type UserType } from './auth'

export type ApiHandler = (
  req: Request,
  session: Awaited<ReturnType<typeof requireAuth>>,
  params?: Record<string, string>
) => Promise<Response>

export function withAuth(handler: ApiHandler, allowedRoles?: UserType[]) {
  return async (req: Request, context?: { params?: Promise<Record<string, string>> }) => {
    try {
      const session = await requireAuth(allowedRoles)
      const params = context?.params ? await context.params : undefined
      return handler(req, session, params)
    } catch (e) {
      if (e instanceof AuthError) {
        return NextResponse.json({ error: e.message }, { status: e.status })
      }
      throw e
    }
  }
}
