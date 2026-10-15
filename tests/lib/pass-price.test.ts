import { describe, expect, it } from 'vitest'
import ro from '../../messages/ro.json'
import en from '../../messages/en.json'
import { PASS_14D_PRICE_BANI, pricingPlanMeta } from '@/lib/content'

describe('14-day pass price', () => {
  it('keeps the advertised RON price in sync with the Stripe amount', () => {
    const passIndex = pricingPlanMeta.findIndex((meta) => meta.planId === 'pass_14d')
    const expected = `${PASS_14D_PRICE_BANI / 100} RON`
    for (const messages of [ro, en]) {
      expect(messages.Pricing.plans[passIndex].price).toBe(expected)
      expect(messages.Billing.buyPass).toContain(expected)
    }
  })

  it('keeps pricing plan copy aligned with pricingPlanMeta', () => {
    expect(ro.Pricing.plans).toHaveLength(pricingPlanMeta.length)
    expect(en.Pricing.plans).toHaveLength(pricingPlanMeta.length)
  })
})
