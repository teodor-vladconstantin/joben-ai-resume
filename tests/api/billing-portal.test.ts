import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const createServerClientMock = vi.fn()
const checkRouteRateLimitMock = vi.fn()
const resolveRateLimitIdentityMock = vi.fn()
const portalSessionsCreateMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@/lib/security/route-rate-limit', () => ({
  checkRouteRateLimit: checkRouteRateLimitMock,
  resolveRateLimitIdentity: resolveRateLimitIdentityMock,
}))

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function StripeMock() {
    return { billingPortal: { sessions: { create: portalSessionsCreateMock } } }
  }),
}))

function makeRequest() {
  return new Request('http://localhost/api/billing/portal', { method: 'POST' })
}

function mockProfile(stripeCustomerId: string | null) {
  createServerClientMock.mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { stripe_customer_id: stripeCustomerId }, error: null }),
        })),
      })),
    })),
  })
}

describe('POST /api/billing/portal', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    createServerClientMock.mockReset()
    checkRouteRateLimitMock.mockReset()
    resolveRateLimitIdentityMock.mockReset()
    portalSessionsCreateMock.mockReset()

    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'

    authMock.mockResolvedValue({ userId: 'user_123' })
    checkRouteRateLimitMock.mockResolvedValue({ ok: true, remaining: 9, resetAt: 0, retryAfter: 0 })
    resolveRateLimitIdentityMock.mockReturnValue('u:user_123')
    portalSessionsCreateMock.mockResolvedValue({ url: 'https://billing.stripe.com/session/bps_123' })
    mockProfile('cus_existing')
  })

  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { POST } = await import('@/app/api/billing/portal/route')

    const response = await POST(makeRequest())
    expect(response.status).toBe(401)
  })

  it('returns 429 with Retry-After when rate-limited', async () => {
    checkRouteRateLimitMock.mockResolvedValue({ ok: false, remaining: 0, resetAt: 0, retryAfter: 17 })
    const { POST } = await import('@/app/api/billing/portal/route')

    const response = await POST(makeRequest())
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('17')
    expect(portalSessionsCreateMock).not.toHaveBeenCalled()
  })

  it('returns 503 when Stripe is not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const { POST } = await import('@/app/api/billing/portal/route')

    const response = await POST(makeRequest())
    expect(response.status).toBe(503)
    expect(portalSessionsCreateMock).not.toHaveBeenCalled()
  })

  it('returns 404 when the user has no Stripe customer yet', async () => {
    mockProfile(null)
    const { POST } = await import('@/app/api/billing/portal/route')

    const response = await POST(makeRequest())
    const payload = (await response.json()) as { error?: string }

    expect(response.status).toBe(404)
    expect(payload.error).toMatch(/subscribe/i)
    expect(portalSessionsCreateMock).not.toHaveBeenCalled()
  })

  it('creates a portal session and returns its url', async () => {
    const { POST } = await import('@/app/api/billing/portal/route')
    const response = await POST(makeRequest())
    const payload = (await response.json()) as { url?: string }

    expect(response.status).toBe(200)
    expect(payload.url).toBe('https://billing.stripe.com/session/bps_123')
    expect(portalSessionsCreateMock).toHaveBeenCalledWith({
      customer: 'cus_existing',
      return_url: 'https://app.example.com/settings',
    })
  })

  it('returns 500 when Stripe throws creating the portal session', async () => {
    portalSessionsCreateMock.mockRejectedValue(new Error('stripe down'))
    const { POST } = await import('@/app/api/billing/portal/route')

    const response = await POST(makeRequest())
    const payload = (await response.json()) as { error?: string }

    expect(response.status).toBe(500)
    expect(payload.error).not.toMatch(/stripe down/i)
  })
})
