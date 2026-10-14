import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const currentUserMock = vi.fn()
const createServerClientMock = vi.fn()
const getUserPlanMock = vi.fn()
const getEmailHintFromSessionClaimsMock = vi.fn()
const checkRouteRateLimitMock = vi.fn()
const resolveRateLimitIdentityMock = vi.fn()
const sendRateLimitEmailIfEligibleMock = vi.fn()
const trackProductEventMock = vi.fn()
const capturePostHogEventMock = vi.fn()
const sessionsCreateMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
  currentUser: currentUserMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@/lib/plans', () => ({
  getUserPlan: getUserPlanMock,
  getEmailHintFromSessionClaims: getEmailHintFromSessionClaimsMock,
  getPriceIdForPlan: (plan: 'pro' | 'recruiting' | 'pass_14d') =>
    plan === 'pass_14d'
      ? undefined
      : plan === 'recruiting' ? process.env.STRIPE_RECRUITING_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID,
}))

vi.mock('@/lib/security/route-rate-limit', () => ({
  checkRouteRateLimit: checkRouteRateLimitMock,
  resolveRateLimitIdentity: resolveRateLimitIdentityMock,
}))

vi.mock('@/lib/email-automation', () => ({
  sendRateLimitEmailIfEligible: sendRateLimitEmailIfEligibleMock,
}))

vi.mock('@/lib/analytics', () => ({
  trackProductEvent: trackProductEventMock,
}))

vi.mock('@/lib/posthog-server', () => ({
  capturePostHogEvent: capturePostHogEventMock,
}))

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function StripeMock() {
    return { checkout: { sessions: { create: sessionsCreateMock } } }
  }),
}))

function mockProfile(data: { stripe_customer_id: string | null; stripe_subscription_id: string | null }) {
  createServerClientMock.mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
        })),
      })),
    })),
  })
}

function makeRequest(body?: unknown) {
  if (body === undefined) {
    return new Request('http://localhost/api/billing/checkout', { method: 'POST' })
  }
  return new Request('http://localhost/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    currentUserMock.mockReset()
    createServerClientMock.mockReset()
    getUserPlanMock.mockReset()
    getEmailHintFromSessionClaimsMock.mockReset()
    checkRouteRateLimitMock.mockReset()
    resolveRateLimitIdentityMock.mockReset()
    sendRateLimitEmailIfEligibleMock.mockReset()
    trackProductEventMock.mockReset()
    capturePostHogEventMock.mockReset()
    sessionsCreateMock.mockReset()

    delete process.env.CHECKOUT_DISABLED
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
    process.env.STRIPE_PRO_PRICE_ID = 'price_dummy'
    process.env.STRIPE_RECRUITING_PRICE_ID = 'price_recruiting_dummy'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'

    authMock.mockResolvedValue({ userId: 'user_123', sessionClaims: {} })
    currentUserMock.mockResolvedValue({ emailAddresses: [{ emailAddress: 'user@example.com' }] })
    createServerClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { stripe_customer_id: null }, error: null }),
          })),
        })),
      })),
    })
    getUserPlanMock.mockResolvedValue('free')
    getEmailHintFromSessionClaimsMock.mockReturnValue(undefined)
    checkRouteRateLimitMock.mockResolvedValue({ ok: true, remaining: 9, resetAt: 0, retryAfter: 0 })
    resolveRateLimitIdentityMock.mockReturnValue('u:user_123')
    sessionsCreateMock.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/pay/cs_123' })
  })

  it('returns 503 when CHECKOUT_DISABLED is set, before any other check', async () => {
    process.env.CHECKOUT_DISABLED = 'true'
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest())
    expect(response.status).toBe(503)
    expect(authMock).not.toHaveBeenCalled()
  })

  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue({ userId: null, sessionClaims: null })
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest())
    expect(response.status).toBe(401)
  })

  it('returns 429 with Retry-After when rate-limited', async () => {
    checkRouteRateLimitMock.mockResolvedValue({ ok: false, remaining: 0, resetAt: 0, retryAfter: 42 })
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest())
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('42')
    expect(sendRateLimitEmailIfEligibleMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_123', route: '/api/billing/checkout' })
    )
    expect(sessionsCreateMock).not.toHaveBeenCalled()
  })

  it('returns 409 when the user already has the recruiting plan', async () => {
    getUserPlanMock.mockResolvedValue('recruiting')
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest())
    const payload = (await response.json()) as { error?: string; currentPlan?: string }

    expect(response.status).toBe(409)
    expect(payload.currentPlan).toBe('recruiting')
    expect(sessionsCreateMock).not.toHaveBeenCalled()
  })

  it('returns 409 instead of opening a second subscription when the user is already subscribed to Pro', async () => {
    getUserPlanMock.mockResolvedValue('pro')
    mockProfile({ stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_1' })
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest())
    const payload = (await response.json()) as { error?: string }

    expect(response.status).toBe(409)
    expect(payload.error).toBe('already_active')
    expect(sessionsCreateMock).not.toHaveBeenCalled()
  })

  it('lets a pass or referral holder (Pro without a subscription) subscribe to Pro', async () => {
    getUserPlanMock.mockResolvedValue('pro')
    mockProfile({ stripe_customer_id: 'cus_1', stripe_subscription_id: null })
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest({ plan: 'pro' }))

    expect(response.status).toBe(200)
    expect(sessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'subscription', customer: 'cus_1' })
    )
  })

  it('returns 409 for the 14-day pass when the user already has a subscription', async () => {
    getUserPlanMock.mockResolvedValue('pro')
    createServerClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_1' },
              error: null,
            }),
          })),
        })),
      })),
    })
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest({ plan: 'pass_14d' }))

    expect(response.status).toBe(409)
    expect(sessionsCreateMock).not.toHaveBeenCalled()
  })

  it('sells the 14-day pass as a one-time 39 RON card payment with withdrawal consent', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest({ plan: 'pass_14d', locale: 'en' }))

    expect(response.status).toBe(200)
    expect(sessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        locale: 'en',
        payment_method_types: ['card'],
        customer_creation: 'always',
        consent_collection: { terms_of_service: 'required' },
        custom_text: {
          terms_of_service_acceptance: {
            message: expect.stringContaining('https://app.example.com/en/terms'),
          },
        },
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: 'ron',
              unit_amount: 3900,
              product_data: expect.objectContaining({ name: 'Joben Interview Pass (14 days)' }),
            }),
          }),
        ],
        metadata: expect.objectContaining({ planId: 'pass_14d' }),
      })
    )
  })

  it('does not set customer_creation for a pass when the Stripe customer already exists', async () => {
    mockProfile({ stripe_customer_id: 'cus_1', stripe_subscription_id: null })
    const { POST } = await import('@/app/api/billing/checkout/route')

    await POST(makeRequest({ plan: 'pass_14d' }))

    const args = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>
    expect(args.customer).toBe('cus_1')
    expect(args).not.toHaveProperty('customer_creation')
  })

  it('returns the unavailable code when checkout is paused', async () => {
    process.env.CHECKOUT_DISABLED = 'true'
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest())
    expect(await response.json()).toMatchObject({ error: 'unavailable' })
  })

  it('returns 503 without leaking which var is missing when Stripe env is incomplete', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest())
    const payload = (await response.json()) as { error?: string }

    expect(response.status).toBe(503)
    expect(payload.error).not.toMatch(/STRIPE_SECRET_KEY|STRIPE_PRO_PRICE_ID/)
    expect(sessionsCreateMock).not.toHaveBeenCalled()
  })

  it('creates a checkout session and returns its url, reusing an existing Stripe customer', async () => {
    createServerClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_existing' }, error: null }),
          })),
        })),
      })),
    })

    const { POST } = await import('@/app/api/billing/checkout/route')
    const response = await POST(makeRequest())
    const payload = (await response.json()) as { url?: string }

    expect(response.status).toBe(200)
    expect(payload.url).toBe('https://checkout.stripe.com/pay/cs_123')
    expect(sessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_dummy', quantity: 1 }],
        success_url: 'https://app.example.com/ro/dashboard?upgrade=success',
        cancel_url: 'https://app.example.com/ro/pricing?upgrade=cancelled',
        metadata: { userId: 'user_123', planId: 'pro' },
        customer: 'cus_existing',
        customer_email: undefined,
        allow_promotion_codes: true,
      })
    )
    expect(trackProductEventMock).toHaveBeenCalled()
    expect(capturePostHogEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ distinctId: 'user_123', event: 'checkout_started' })
    )
  })

  it('falls back to customer_email when there is no existing Stripe customer', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')
    await POST(makeRequest())

    expect(sessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ customer: undefined, customer_email: 'user@example.com' })
    )
  })

  it('returns 500 when Stripe throws creating the session', async () => {
    sessionsCreateMock.mockRejectedValue(new Error('stripe down'))
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest())
    const payload = (await response.json()) as { error?: string }

    expect(response.status).toBe(500)
    expect(payload.error).not.toMatch(/stripe down/i)
  })

  it('returns 500 when the session has no url', async () => {
    sessionsCreateMock.mockResolvedValue({ id: 'cs_123', url: null })
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest())
    expect(response.status).toBe(500)
  })

  it('returns 400 for an invalid plan value', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest({ plan: 'enterprise' }))
    expect(response.status).toBe(400)
    expect(sessionsCreateMock).not.toHaveBeenCalled()
  })

  it('returns 400 for a malformed JSON body', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')
    const request = new Request('http://localhost/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    expect(sessionsCreateMock).not.toHaveBeenCalled()
  })

  it('creates a Recruiting Plan checkout session when plan is "recruiting"', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest({ plan: 'recruiting' }))
    const payload = (await response.json()) as { url?: string }

    expect(response.status).toBe(200)
    expect(payload.url).toBe('https://checkout.stripe.com/pay/cs_123')
    expect(sessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_recruiting_dummy', quantity: 1 }],
        metadata: { userId: 'user_123', planId: 'recruiting' },
      })
    )
    expect(capturePostHogEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ properties: { plan: 'recruiting' } })
    )
  })

  it('returns 503 when the Recruiting Plan price id is missing, without touching the Pro price', async () => {
    delete process.env.STRIPE_RECRUITING_PRICE_ID
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest({ plan: 'recruiting' }))
    expect(response.status).toBe(503)
    expect(sessionsCreateMock).not.toHaveBeenCalled()
  })

  it('defaults to the Pro plan when no body is sent', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    expect(sessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_dummy', quantity: 1 }],
        metadata: { userId: 'user_123', planId: 'pro' },
      })
    )
  })
})
