import { describe, expect, it } from 'vitest'
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
