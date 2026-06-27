import { NextResponse } from 'next/server'

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  retryAfterSec?: number
}

const buckets = new Map<string, { count: number; reset: number }>()

/** Fixed-window in-memory limiter (per server instance). */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + config.windowMs })
    return { ok: true }
  }

  if (entry.count >= config.limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((entry.reset - now) / 1000)) }
  }

  entry.count++
  return { ok: true }
}

export function rateLimitResponse(retryAfterSec = 60): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    },
  )
}

export const RATE_LIMITS = {
  signup: { limit: 5, windowMs: 60 * 60 * 1000 },
  publicBookingIp: { limit: 15, windowMs: 60 * 60 * 1000 },
  publicBookingPhone: { limit: 5, windowMs: 24 * 60 * 60 * 1000 },
  publicRead: { limit: 180, windowMs: 60 * 1000 },
  sendEmail: { limit: 30, windowMs: 60 * 60 * 1000 },
  pushSubscribe: { limit: 20, windowMs: 60 * 60 * 1000 },
  accountDelete: { limit: 3, windowMs: 24 * 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>

export function enforceRateLimit(
  key: string,
  config: RateLimitConfig,
): NextResponse | null {
  const result = checkRateLimit(key, config)
  if (result.ok) return null
  return rateLimitResponse(result.retryAfterSec)
}
