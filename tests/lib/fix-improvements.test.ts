import { describe, expect, it, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))

const { addsUnsupportedClaims } = await import('@/lib/fix-improvements')

describe('addsUnsupportedClaims', () => {
  const entry = {
    id: 'exp_1',
    title: 'Sales Manager',
    company: 'Acme',
    period: '2019 - 2022',
    bullets: ['Managed a team of 6 reps', 'Handled key accounts'],
  }

  it('accepts a rewrite that only reuses facts from the role', () => {
    expect(addsUnsupportedClaims('Led a 6-person sales team across key accounts', entry)).toBe(false)
  })

  it('rejects invented metrics and copied placeholders', () => {
    expect(addsUnsupportedClaims('Grew key-account revenue by 30%', entry)).toBe(true)
    expect(addsUnsupportedClaims('Grew key-account revenue by [X%]', entry)).toBe(true)
  })
})
