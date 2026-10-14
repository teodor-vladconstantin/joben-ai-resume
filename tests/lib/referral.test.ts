import { beforeEach, describe, it, expect, vi } from 'vitest'

const { invalidatePlanCacheMock, createServerClientMock, sendReferralRewardEmailMock, getUserLocaleMock } = vi.hoisted(() => ({
  invalidatePlanCacheMock: vi.fn(),
  createServerClientMock: vi.fn(),
  sendReferralRewardEmailMock: vi.fn(),
  getUserLocaleMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createServerClient: createServerClientMock }))
vi.mock('@/lib/ratelimit', () => ({ invalidatePlanCache: invalidatePlanCacheMock }))
vi.mock('@/lib/posthog-server', () => ({ capturePostHogEvent: vi.fn() }))
vi.mock('@/lib/resend', () => ({ sendReferralRewardEmail: sendReferralRewardEmailMock }))
vi.mock('@/lib/user-locale', () => ({ getUserLocale: getUserLocaleMock }))

import {
  extendExpiry,
  formatReferralCode,
  generateReferralCode,
  processReferralAttribution,
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

// Minimal in-memory stand-in for the Supabase query chains processReferralAttribution uses.
type UserRow = {
  clerk_id: string
  email?: string
  plan: string
  pro_expires_at: string | null
  referral_code: string | null
  created_at: string
  stripe_subscription_id?: string | null
}
type ReferralRow = { referrer_id: string; referred_user_id: string; status: string; reward_days_granted: number; created_at: string }
type Op = { table: string; kind: 'select' | 'insert' | 'update' | 'delete'; payload?: Record<string, unknown>; filters: Record<string, unknown>; gte: Record<string, string>; count: boolean }
type Result = { data?: unknown; error?: { message: string; code?: string } | null; count?: number }

function fakeDb(users: UserRow[], referrals: ReferralRow[], failUpdateFor?: string) {
  const run = (op: Op): Result => {
    const matches = <T extends object>(row: T) =>
      Object.entries(op.filters).every(([k, v]) => (row as Record<string, unknown>)[k] === v) &&
      Object.entries(op.gte).every(([k, v]) => String((row as Record<string, unknown>)[k]) >= v)
    if (op.table === 'users') {
      if (op.kind === 'update') {
        if (op.filters.clerk_id === failUpdateFor && 'pro_expires_at' in (op.payload ?? {})) {
          return { error: { message: 'boom' } }
        }
        users.filter(matches).forEach((u) => Object.assign(u, op.payload))
        return { error: null }
      }
      return { data: users.find(matches) ?? null, error: null }
    }
    if (op.kind === 'insert') {
      const row = op.payload as unknown as ReferralRow
      if (referrals.some((r) => r.referred_user_id === row.referred_user_id)) {
        return { error: { message: 'dup', code: '23505' } }
      }
      referrals.push({ ...row, created_at: new Date().toISOString() })
      return { error: null }
    }
    if (op.kind === 'delete') {
      for (let i = referrals.length - 1; i >= 0; i--) if (matches(referrals[i])) referrals.splice(i, 1)
      return { error: null }
    }
    const rows = referrals.filter(matches)
    return op.count ? { count: rows.length, error: null } : { data: rows[0] ?? null, error: null }
  }

  return {
    from: (table: string) => {
      const op: Op = { table, kind: 'select', filters: {}, gte: {}, count: false }
      const chain = {
        select: (_cols?: string, opts?: { count?: string }) => {
          op.count = Boolean(opts?.count)
          return chain
        },
        insert: (payload: Record<string, unknown>) => ((op.kind = 'insert'), (op.payload = payload), chain),
        update: (payload: Record<string, unknown>) => ((op.kind = 'update'), (op.payload = payload), chain),
        delete: () => ((op.kind = 'delete'), chain),
        eq: (column: string, value: unknown) => ((op.filters[column] = value), chain),
        gte: (column: string, value: string) => ((op.gte[column] = value), chain),
        maybeSingle: () => Promise.resolve(run(op)),
        then: (resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) =>
          Promise.resolve(run(op)).then(resolve, reject),
      }
      return chain
    },
  }
}

function seed() {
  const now = new Date().toISOString()
  const users: UserRow[] = [
    {
      clerk_id: 'referrer',
      email: 'ref@example.com',
      plan: 'free',
      pro_expires_at: null,
      referral_code: 'JOBEN-AAAA2222',
      created_at: new Date(Date.now() - 90 * DAY).toISOString(),
    },
    { clerk_id: 'newbie', plan: 'free', pro_expires_at: null, referral_code: null, created_at: now },
  ]
  return { users, referrals: [] as ReferralRow[] }
}

describe('processReferralAttribution', () => {
  beforeEach(() => {
    invalidatePlanCacheMock.mockReset()
    createServerClientMock.mockReset()
    sendReferralRewardEmailMock.mockReset().mockResolvedValue({ success: true })
    getUserLocaleMock.mockReset().mockResolvedValue('en')
  })

  it('emails the referrer in their own locale with the new expiry and remaining rewards', async () => {
    const { users, referrals } = seed()
    createServerClientMock.mockReturnValue(fakeDb(users, referrals))

    await processReferralAttribution({ newUserId: 'newbie', referralCode: 'JOBEN-AAAA2222' })

    expect(getUserLocaleMock).toHaveBeenCalledWith('referrer')
    expect(sendReferralRewardEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ref@example.com',
        locale: 'en',
        days: 7,
        proUntil: users.find((u) => u.clerk_id === 'referrer')?.pro_expires_at,
        hasSubscription: false,
        remainingRewards: 9,
      })
    )
  })

  it('tells a subscribed referrer the days are saved (no "Pro until" date)', async () => {
    const { users, referrals } = seed()
    Object.assign(users[0], { plan: 'pro', stripe_subscription_id: 'sub_1' })
    createServerClientMock.mockReturnValue(fakeDb(users, referrals))

    await processReferralAttribution({ newUserId: 'newbie', referralCode: 'JOBEN-AAAA2222' })

    expect(sendReferralRewardEmailMock).toHaveBeenCalledWith(expect.objectContaining({ hasSubscription: true }))
  })

  it('caps the referrer at 10 rewards in total, even when they are old', async () => {
    const { users, referrals } = seed()
    const longAgo = new Date(Date.now() - 400 * DAY).toISOString()
    for (let i = 0; i < 10; i++) {
      referrals.push({ referrer_id: 'referrer', referred_user_id: `old${i}`, status: 'completed', reward_days_granted: 7, created_at: longAgo })
    }
    createServerClientMock.mockReturnValue(fakeDb(users, referrals))

    const result = await processReferralAttribution({ newUserId: 'newbie', referralCode: 'JOBEN-AAAA2222' })

    expect(result).toMatchObject({ success: true, status: 'capped', referrerRewardDays: 0 })
    expect(sendReferralRewardEmailMock).not.toHaveBeenCalled()
  })

  it('rejects an account older than 7 days, so existing users cannot self-claim', async () => {
    const { users, referrals } = seed()
    const newbie = users.find((u) => u.clerk_id === 'newbie')!
    newbie.created_at = new Date(Date.now() - 30 * DAY).toISOString()
    createServerClientMock.mockReturnValue(fakeDb(users, referrals))

    const result = await processReferralAttribution({ newUserId: 'newbie', referralCode: 'JOBEN-AAAA2222' })

    expect(result.success).toBe(false)
    expect(referrals).toHaveLength(0)
    expect(users.every((u) => u.pro_expires_at === null)).toBe(true)
  })

  it('a failed reward email does not fail the attribution', async () => {
    const { users, referrals } = seed()
    createServerClientMock.mockReturnValue(fakeDb(users, referrals))
    sendReferralRewardEmailMock.mockRejectedValue(new Error('smtp down'))

    const result = await processReferralAttribution({ newUserId: 'newbie', referralCode: 'JOBEN-AAAA2222' })

    expect(result).toMatchObject({ success: true, status: 'completed' })
  })

  it('grants both sides and invalidates both plan caches', async () => {
    const { users, referrals } = seed()
    createServerClientMock.mockReturnValue(fakeDb(users, referrals))

    const result = await processReferralAttribution({ newUserId: 'newbie', referralCode: 'joben-aaaa2222' })

    expect(result).toMatchObject({ success: true, status: 'completed', referrerRewardDays: 7, referredRewardDays: 3 })
    expect(users.every((u) => u.plan === 'pro' && u.pro_expires_at)).toBe(true)
    expect(referrals).toHaveLength(1)
    expect(invalidatePlanCacheMock.mock.calls.map(([id]) => id).sort()).toEqual(['newbie', 'referrer'])
  })

  it('still rewards the new user when the referrer is capped', async () => {
    const { users, referrals } = seed()
    for (let i = 0; i < 5; i++) {
      referrals.push({ referrer_id: 'referrer', referred_user_id: `old${i}`, status: 'completed', reward_days_granted: 7, created_at: new Date().toISOString() })
    }
    createServerClientMock.mockReturnValue(fakeDb(users, referrals))

    const result = await processReferralAttribution({ newUserId: 'newbie', referralCode: 'JOBEN-AAAA2222' })

    expect(result).toMatchObject({ success: true, status: 'capped', referrerRewardDays: 0 })
    expect(users.find((u) => u.clerk_id === 'newbie')?.plan).toBe('pro')
    expect(users.find((u) => u.clerk_id === 'referrer')?.pro_expires_at).toBeNull()
    expect(referrals.find((r) => r.referred_user_id === 'newbie')).toMatchObject({ status: 'capped', reward_days_granted: 0 })
    expect(invalidatePlanCacheMock).toHaveBeenCalledWith('newbie')
    expect(invalidatePlanCacheMock).not.toHaveBeenCalledWith('referrer')
  })

  it('releases the claim and throws when a grant fails, so a retry can redo it', async () => {
    const { users, referrals } = seed()
    createServerClientMock.mockReturnValue(fakeDb(users, referrals, 'referrer'))

    await expect(processReferralAttribution({ newUserId: 'newbie', referralCode: 'JOBEN-AAAA2222' })).rejects.toThrow()
    expect(referrals).toHaveLength(0)
  })

  it('is a no-op for an already attributed user', async () => {
    const { users, referrals } = seed()
    referrals.push({ referrer_id: 'referrer', referred_user_id: 'newbie', status: 'completed', reward_days_granted: 7, created_at: new Date().toISOString() })
    createServerClientMock.mockReturnValue(fakeDb(users, referrals))

    const result = await processReferralAttribution({ newUserId: 'newbie', referralCode: 'JOBEN-AAAA2222' })

    expect(result.success).toBe(false)
    expect(users.every((u) => u.pro_expires_at === null)).toBe(true)
  })
})
