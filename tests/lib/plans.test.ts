import { afterEach, describe, expect, it, vi } from 'vitest'

describe('resolvePlanFromPriceId', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('resolves the Pro price id to "pro"', async () => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro_123')
    vi.stubEnv('STRIPE_RECRUITING_PRICE_ID', 'price_recruiting_456')

    const { resolvePlanFromPriceId } = await import('@/lib/plans')
    expect(resolvePlanFromPriceId('price_pro_123')).toBe('pro')
  })

  it('resolves the Recruiting price id to "recruiting"', async () => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro_123')
    vi.stubEnv('STRIPE_RECRUITING_PRICE_ID', 'price_recruiting_456')

    const { resolvePlanFromPriceId } = await import('@/lib/plans')
    expect(resolvePlanFromPriceId('price_recruiting_456')).toBe('recruiting')
  })

  it('returns null for an unrecognized price id', async () => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro_123')
    vi.stubEnv('STRIPE_RECRUITING_PRICE_ID', 'price_recruiting_456')

    const { resolvePlanFromPriceId } = await import('@/lib/plans')
    expect(resolvePlanFromPriceId('price_unknown')).toBeNull()
  })

  it('returns null for a null/undefined price id', async () => {
    const { resolvePlanFromPriceId } = await import('@/lib/plans')
    expect(resolvePlanFromPriceId(null)).toBeNull()
    expect(resolvePlanFromPriceId(undefined)).toBeNull()
  })
})

describe('getPriceIdForPlan', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the Pro price id for "pro"', async () => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro_123')
    vi.stubEnv('STRIPE_RECRUITING_PRICE_ID', 'price_recruiting_456')

    const { getPriceIdForPlan } = await import('@/lib/plans')
    expect(getPriceIdForPlan('pro')).toBe('price_pro_123')
  })

  it('returns the Recruiting price id for "recruiting"', async () => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro_123')
    vi.stubEnv('STRIPE_RECRUITING_PRICE_ID', 'price_recruiting_456')

    const { getPriceIdForPlan } = await import('@/lib/plans')
    expect(getPriceIdForPlan('recruiting')).toBe('price_recruiting_456')
  })
})
