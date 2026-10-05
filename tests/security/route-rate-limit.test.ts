import { describe, expect, it, vi } from 'vitest'
import { resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'

describe('resolveRateLimitIdentity', () => {
  it('prefixes userId when present', () => {
    const req = new Request('http://localhost')
    expect(resolveRateLimitIdentity(req, 'user_123')).toBe('u:user_123')
  })

  it('hashes the IP instead of storing it raw', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.42' },
    })
    const identity = resolveRateLimitIdentity(req, null)
    expect(identity.startsWith('ip:')).toBe(true)
    expect(identity).not.toContain('203.0.113.42')
    expect(identity).toBe(resolveRateLimitIdentity(req, null)) // deterministic
  })

  it('falls back to ip:unknown with no IP and no userId', () => {
    const req = new Request('http://localhost')
    expect(resolveRateLimitIdentity(req, null)).toBe('ip:unknown')
  })
})

describe('checkRouteRateLimit failure modes', () => {
  it('allows when Redis is unavailable by default and denies with failClosed', async () => {
    vi.resetModules()
    vi.doMock('@/lib/ratelimit', () => ({ getRedisClient: () => null }))
    const { checkRouteRateLimit, isLocked } = await import('@/lib/security/route-rate-limit')
    const base = { name: 'x', identifier: 'id', limit: 1, windowSeconds: 60 }

    expect((await checkRouteRateLimit(base)).ok).toBe(true)
    const closed = await checkRouteRateLimit({ ...base, failClosed: true })
    expect(closed.ok).toBe(false)
    expect(closed.retryAfter).toBeGreaterThan(0)

    expect(await isLocked('k')).toBe(false)
    expect(await isLocked('k', true)).toBe(true)
    vi.doUnmock('@/lib/ratelimit')
  })

  it('denies with failClosed when a Redis call throws', async () => {
    vi.resetModules()
    vi.doMock('@/lib/ratelimit', () => ({
      getRedisClient: () => ({ incr: () => Promise.reject(new Error('down')) }),
    }))
    const { checkRouteRateLimit } = await import('@/lib/security/route-rate-limit')
    const base = { name: 'x', identifier: 'id', limit: 1, windowSeconds: 60 }
    expect((await checkRouteRateLimit(base)).ok).toBe(true)
    expect((await checkRouteRateLimit({ ...base, failClosed: true })).ok).toBe(false)
    vi.doUnmock('@/lib/ratelimit')
  })
})
