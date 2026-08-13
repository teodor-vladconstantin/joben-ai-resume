import { beforeEach, describe, expect, it, vi } from 'vitest'

const getRedisClientMock = vi.fn()
const checkRouteRateLimitMock = vi.fn()
const resolveRateLimitIdentityMock = vi.fn()
const createServerClientMock = vi.fn()

vi.mock('@/lib/ratelimit', () => ({
  getRedisClient: getRedisClientMock,
}))

vi.mock('@/lib/security/route-rate-limit', () => ({
  checkRouteRateLimit: checkRouteRateLimitMock,
  resolveRateLimitIdentity: resolveRateLimitIdentityMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

describe('signup consent API', () => {
  beforeEach(() => {
    vi.resetModules()
    getRedisClientMock.mockReset()
    checkRouteRateLimitMock.mockReset()
    resolveRateLimitIdentityMock.mockReset()
    createServerClientMock.mockReset()
  })

  it('fails closed with 503 when Redis is not configured', async () => {
    getRedisClientMock.mockReturnValue(null)
    const { POST } = await import('@/app/api/signup/consent/route')

    const response = await POST(new Request('http://localhost/api/signup/consent', { method: 'POST' }))

    expect(response.status).toBe(503)
    expect(checkRouteRateLimitMock).not.toHaveBeenCalled()
  })

  it('returns 429 when the per-IP rate limit is exceeded', async () => {
    getRedisClientMock.mockReturnValue({})
    resolveRateLimitIdentityMock.mockReturnValue('ip:abc123')
    checkRouteRateLimitMock.mockResolvedValue({ ok: false, remaining: 0, resetAt: 0, retryAfter: 30 })
    const { POST } = await import('@/app/api/signup/consent/route')

    const response = await POST(new Request('http://localhost/api/signup/consent', { method: 'POST' }))

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('30')
  })

  it('inserts a consent row and returns a token when allowed', async () => {
    getRedisClientMock.mockReturnValue({})
    resolveRateLimitIdentityMock.mockReturnValue('ip:abc123')
    checkRouteRateLimitMock.mockResolvedValue({ ok: true, remaining: 5, resetAt: 0, retryAfter: 0 })

    const insertMock = vi.fn().mockResolvedValue({ error: null })
    createServerClientMock.mockReturnValue({
      from: vi.fn(() => ({ insert: insertMock })),
    })

    const { POST } = await import('@/app/api/signup/consent/route')

    const response = await POST(new Request('http://localhost/api/signup/consent', { method: 'POST' }))
    const payload = (await response.json()) as { data?: { token?: string }; token?: string }

    expect(response.status).toBe(200)
    const token = payload.data?.token ?? payload.token
    expect(typeof token).toBe('string')
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ token, ip_hash: 'abc123', tos_version: expect.any(String) })
    )
  })

  it('returns 500 when the consent insert fails', async () => {
    getRedisClientMock.mockReturnValue({})
    resolveRateLimitIdentityMock.mockReturnValue('ip:abc123')
    checkRouteRateLimitMock.mockResolvedValue({ ok: true, remaining: 5, resetAt: 0, retryAfter: 0 })

    const insertMock = vi.fn().mockResolvedValue({ error: { message: 'db down' } })
    createServerClientMock.mockReturnValue({
      from: vi.fn(() => ({ insert: insertMock })),
    })

    const { POST } = await import('@/app/api/signup/consent/route')

    const response = await POST(new Request('http://localhost/api/signup/consent', { method: 'POST' }))

    expect(response.status).toBe(500)
  })
})
