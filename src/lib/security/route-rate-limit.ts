// SECURITY: lightweight per-route fixed-window rate limiter built on
// Upstash Redis (already in dependencies). Used for endpoints that need
// burst protection beyond the existing monthly feature counters in
// @/lib/ratelimit (CLAUDE.md sections "Rate Limiting" and Critical #2/#4).
//
// Design: INCR + EXPIRE on first hit. The race between two concurrent first
// calls is acceptable: at worst the key keeps the original TTL.

import { createHash } from 'crypto'
import { getRedisClient } from '@/lib/ratelimit'

export type RouteRateLimitOptions = {
  /** Stable name for the route (used as Redis key prefix). */
  name: string
  /** Identity to limit on, typically a Clerk userId. Falls back to IP. */
  identifier: string
  /** Maximum allowed requests inside the window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
}

export type RouteRateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: number // epoch seconds
  retryAfter: number // seconds until reset; 0 when ok
}

const FAILSAFE_RESULT: RouteRateLimitResult = {
  ok: true,
  remaining: Number.POSITIVE_INFINITY,
  resetAt: 0,
  retryAfter: 0,
}

export async function checkRouteRateLimit(opts: RouteRateLimitOptions): Promise<RouteRateLimitResult> {
  const redis = getRedisClient()
  if (!redis) {
    // Degraded mode: allow the request but log nothing here (callers may
    // log if they care). We do not want a missing Redis to block users.
    return FAILSAFE_RESULT
  }

  const window = Math.max(1, Math.floor(opts.windowSeconds))
  const limit = Math.max(1, Math.floor(opts.limit))
  const bucket = Math.floor(Date.now() / 1000 / window)
  const key = `rl:${opts.name}:${opts.identifier}:${bucket}`

  let count: number
  try {
    count = (await redis.incr(key)) as number
    if (count === 1) {
      // First request in this window → set TTL so the key expires cleanly.
      await redis.expire(key, window + 1)
    }
  } catch {
    return FAILSAFE_RESULT
  }

  const resetAt = (bucket + 1) * window
  const remaining = Math.max(0, limit - count)
  const ok = count <= limit
  const retryAfter = ok ? 0 : Math.max(1, resetAt - Math.floor(Date.now() / 1000))

  return { ok, remaining, resetAt, retryAfter }
}

/**
 * Best-effort identifier resolver: prefer the authenticated userId, then
 * a hashed X-Forwarded-For client IP (hashed so raw IPs are never stored
 * as Redis key names), finally a string literal so the limiter still
 * works in development.
 */
export function resolveRateLimitIdentity(req: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`
  const xff = req.headers.get('x-forwarded-for') || ''
  const ip = xff.split(',')[0]?.trim()
  if (ip) return `ip:${createHash('sha256').update(ip).digest('hex').slice(0, 16)}`
  return 'ip:unknown'
}

/**
 * Increment a cumulative counter (no window) — handy for lockouts. Returns
 * the post-increment value so callers can decide whether to lock the user.
 */
export async function bumpCounter(key: string, ttlSeconds: number): Promise<number> {
  const redis = getRedisClient()
  if (!redis) return 0

  try {
    const value = (await redis.incr(key)) as number
    if (value === 1 && ttlSeconds > 0) {
      await redis.expire(key, ttlSeconds)
    }
    return value
  } catch {
    return 0
  }
}

export async function isLocked(key: string): Promise<boolean> {
  const redis = getRedisClient()
  if (!redis) return false
  try {
    const value = await redis.get(key)
    return value !== null && value !== undefined
  } catch {
    return false
  }
}

export async function setLock(key: string, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return
  try {
    await redis.set(key, '1', { ex: Math.max(1, Math.floor(ttlSeconds)) })
  } catch {
    // best-effort
  }
}
