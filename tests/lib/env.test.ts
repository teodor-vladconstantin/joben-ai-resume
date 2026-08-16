import { afterEach, describe, expect, it, vi } from 'vitest'

describe('validateStripeLocalConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws when a live Stripe key is used with a localhost app URL', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_abc123')
    vi.stubEnv('ALLOW_STRIPE_LIVE_ON_LOCALHOST', '')

    const { validateStripeLocalConfig } = await import('@/lib/env')
    expect(() => validateStripeLocalConfig()).toThrow(/live Stripe secret key/i)
  })

  it('does not throw for a test-mode key on localhost', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_abc123')

    const { validateStripeLocalConfig } = await import('@/lib/env')
    expect(() => validateStripeLocalConfig()).not.toThrow()
  })

  it('does not throw for a live key on a non-localhost app URL', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://staging.example.com')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_abc123')

    const { validateStripeLocalConfig } = await import('@/lib/env')
    expect(() => validateStripeLocalConfig()).not.toThrow()
  })

  it('does not throw when ALLOW_STRIPE_LIVE_ON_LOCALHOST is set', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_abc123')
    vi.stubEnv('ALLOW_STRIPE_LIVE_ON_LOCALHOST', 'true')

    const { validateStripeLocalConfig } = await import('@/lib/env')
    expect(() => validateStripeLocalConfig()).not.toThrow()
  })

  it('does not throw in production regardless of key/URL combination', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_abc123')

    const { validateStripeLocalConfig } = await import('@/lib/env')
    expect(() => validateStripeLocalConfig()).not.toThrow()
  })
})
