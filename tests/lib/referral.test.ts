import { describe, it, expect } from 'vitest'
import {
  extendExpiry,
  formatReferralCode,
  generateReferralCode,
  REFERRER_REWARD_DAYS,
  REFERRED_REWARD_DAYS,
} from '@/lib/referral'

const DAY = 24 * 60 * 60 * 1000

describe('Bilateral Referral System Logic', () => {
  it('formats referral codes properly', () => {
    expect(formatReferralCode(' joben-xyz12 ')).toBe('JOBEN-XYZ12')
    expect(formatReferralCode('Ref!@#123')).toBe('REF123')
    expect(formatReferralCode('A'.repeat(50))).toHaveLength(30)
  })

  it('generates random 8-char codes without ambiguous characters', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateReferralCode()))
    expect(codes.size).toBe(200)
    for (const code of codes) expect(code).toMatch(/^JOBEN-[A-HJ-NP-Z2-9]{8}$/)
  })

  it('guarantees bilateral rewards (7 days for referrer, 3 days for invited)', () => {
    expect(REFERRER_REWARD_DAYS).toBe(7)
    expect(REFERRED_REWARD_DAYS).toBe(3)
  })

  it('extendExpiry starts from now when there is no active grant', () => {
    const now = Date.UTC(2026, 9, 14)
    expect(extendExpiry(null, 14, now)).toBe(new Date(now + 14 * DAY).toISOString())
    const expired = new Date(now - 5 * DAY).toISOString()
    expect(extendExpiry(expired, 14, now)).toBe(new Date(now + 14 * DAY).toISOString())
  })

  it('extendExpiry stacks on an active grant instead of discarding remaining days', () => {
    const now = Date.UTC(2026, 9, 14)
    const active = new Date(now + 3 * DAY).toISOString()
    expect(extendExpiry(active, 14, now)).toBe(new Date(now + 17 * DAY).toISOString())
  })
})
