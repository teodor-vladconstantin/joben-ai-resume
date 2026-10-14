import { beforeEach, describe, expect, it, vi } from 'vitest'

const { redisMock, resolveUserPlanMock, profileMock } = vi.hoisted(() => ({
  redisMock: { get: vi.fn(), setex: vi.fn() },
  resolveUserPlanMock: vi.fn(),
  profileMock: vi.fn(),
}))

vi.mock('@/lib/upstash', () => ({ getUpstashClient: () => redisMock }))
vi.mock('@/lib/plans', () => ({ getUserPlan: resolveUserPlanMock }))
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profileMock(), error: null }) }) }),
    }),
  }),
}))

import { getUserPlan } from '@/lib/ratelimit'

describe('ratelimit getUserPlan cache TTL', () => {
  beforeEach(() => {
    redisMock.get.mockReset().mockResolvedValue(null)
    redisMock.setex.mockReset().mockResolvedValue('OK')
    resolveUserPlanMock.mockReset().mockResolvedValue('pro')
    profileMock.mockReset()
  })

  it('caps the TTL at the seconds left on a pass/referral grant', async () => {
    profileMock.mockReturnValue({ pro_expires_at: new Date(Date.now() + 600_000).toISOString(), stripe_subscription_id: null })
    await getUserPlan('user_1')
    const ttl = redisMock.setex.mock.calls[0][1] as number
    expect(ttl).toBeGreaterThanOrEqual(598)
    expect(ttl).toBeLessThanOrEqual(600)
  })

  it('never goes below 60 seconds', async () => {
    profileMock.mockReturnValue({ pro_expires_at: new Date(Date.now() + 5_000).toISOString(), stripe_subscription_id: null })
    await getUserPlan('user_1')
    expect(redisMock.setex).toHaveBeenCalledWith('plan:user_1', 60, 'pro')
  })

  it('keeps the full hour for subscribers and long grants', async () => {
    profileMock.mockReturnValue({ pro_expires_at: new Date(Date.now() + 60_000).toISOString(), stripe_subscription_id: 'sub_1' })
    await getUserPlan('user_1')
    profileMock.mockReturnValue({ pro_expires_at: new Date(Date.now() + 10 * 86_400_000).toISOString(), stripe_subscription_id: null })
    await getUserPlan('user_2')
    expect(redisMock.setex.mock.calls.map((c) => c[1])).toEqual([3600, 3600])
  })
})
