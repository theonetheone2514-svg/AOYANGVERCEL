import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { supabase } from './supabase'

const SESSION_COOKIE = 'session_token'
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export class UnauthorizedError extends AuthError {
  constructor() {
    super('กรุณาเข้าสู่ระบบก่อน', 401)
  }
}

export class ForbiddenError extends AuthError {
  constructor() {
    super('ไม่มีสิทธิ์เข้าถึงหน้านี้', 403)
  }
}

export type UserType = 'customer' | 'merchant' | 'rider' | 'admin'

export interface SessionInfo {
  token: string
  phone: string
  user_type: UserType
  user_id: string
  expires_at: string
  created_at: string
}

export async function requireAuth(allowedRoles?: UserType[]): Promise<SessionInfo> {
  const session = await getCurrentSession()
  if (!session) throw new UnauthorizedError()
  if (allowedRoles && !allowedRoles.includes(session.user_type as UserType)) throw new ForbiddenError()
  return session as SessionInfo
}

export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function hashOtp(phone: string, otp: string): string {
  return createHash('sha256').update(`${phone}:${otp}`).digest('hex')
}

export async function createSession(
  phone: string,
  userType: 'customer' | 'merchant' | 'rider' | 'admin',
  userId?: string
) {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL).toISOString()

  const { error } = await supabase.from('sessions').insert({
    phone,
    token,
    user_type: userType,
    user_id: userId,
    expires_at: expiresAt,
  })

  if (error) throw new Error(error.message)
  return token
}

export async function getSessionFromToken(token: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('token', token)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null
  return data
}

export async function getCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  return getSessionFromToken(token)
}

export async function destroySession(token: string) {
  await supabase.from('sessions').delete().eq('token', token)
}

export function getSessionCookieHeaders(token: string): Record<string, string> {
  return {
    'Set-Cookie': `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL / 1000}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`,
  }
}

export function getLogoutCookieHeaders(): Record<string, string> {
  return {
    'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
  }
}
