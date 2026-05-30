import { NextResponse } from 'next/server'
import { supabase } from './supabase'
import { logger } from './logger'

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

export async function checkRateLimit(
  key: string,
  config?: Partial<RateLimitConfig>
): Promise<Response | null> {
  const result = await rateLimit(key, config)
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'โหลดเยอะเกินไป กรุณาลองใหม่ภายหลัง' },
      { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
    )
  }
  return null
}

export async function rateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const { maxRequests, windowMs } = { ...defaults, ...config }

  try {
    const { data, error } = await supabase.rpc('rate_limit_check', {
      p_key: key,
      p_max_requests: maxRequests,
      p_window_ms: windowMs,
    })

    if (error || !data) {
      logger.error('rate_limit_check failed', { error: String(error) })
      return { allowed: false, remaining: 0, retryAfter: 60 }
    }

    return data
  } catch {
    return { allowed: false, remaining: 0, retryAfter: 60 }
  }
}
