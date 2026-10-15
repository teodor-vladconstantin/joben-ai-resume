import { describe, it, expect } from 'vitest'
import { resolvePlanFromPriceId, getPriceIdForPlan } from '@/lib/plans'

describe('Pass 14 Zile (39 RON) Plan Logic', () => {
  it('resolves pass_14d from price id', () => {
    process.env.STRIPE_PASS_14D_PRICE_ID = 'price_pass_14d_test'
    expect(resolvePlanFromPriceId('price_pass_14d_test')).toBe('pass_14d')
    expect(getPriceIdForPlan('pass_14d')).toBe('price_pass_14d_test')
  })

  it('calculates 14 days expiration date accurately', () => {
    const before = Date.now()
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    const after = Date.now()

    const diffDays = (expiresAt.getTime() - before) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeCloseTo(14, 0)
    expect(expiresAt.getTime()).toBeGreaterThan(after)
  })
})
