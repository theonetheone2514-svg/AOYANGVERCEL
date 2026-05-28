import { NextResponse } from 'next/server'

const store = new Map<string, { count: number; resetAt: number }>()

let cleanupInterval: ReturnType<typeof setInterval> | null = null
function startCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, val] of store) {
      if (val.resetAt <= now) store.delete(key)
    }
  }, 60_000)
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const defaults = { maxRequests: 30, windowMs: 60_000 }

export function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

export function checkRateLimit(
  key: string,
  config?: Partial<RateLimitConfig>
): Response | null {
  const result = rateLimit(key, config)
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'โหลดเยอะเกินไป กรุณาลองใหม่ภายหลัง' },
      { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
    )
  }
  return null
}

export function rateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; retryAfter?: number } {
  startCleanup()
  const { maxRequests, windowMs } = { ...defaults, ...config }
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count }
}
