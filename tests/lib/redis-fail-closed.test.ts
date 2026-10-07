import { beforeEach, describe, expect, it, vi } from 'vitest'

// Redis that answers every pipeline with an error, like an Upstash outage.
const failingRedis = {
  pipeline: () => ({
    get: vi.fn(),
    exec: async () => {
      throw new Error('upstash unreachable')
    },
  }),
}

vi.mock('@/lib/upstash', () => ({ getUpstashClient: () => failingRedis }))
vi.mock('@/lib/plans', () => ({ getUserPlan: vi.fn() }))
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))

describe('checkAndReserveTokens when Redis errors', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('denies free-plan requests as unavailable instead of allowing unmetered AI spend', async () => {
    const { checkAndReserveTokens } = await import('@/lib/ratelimit')
    await expect(checkAndReserveTokens('user_free', 'free', 500)).resolves.toMatchObject({
      allowed: false,
      limitType: 'unavailable',
    })
  })

  it('keeps paid plans available', async () => {
    const { checkAndReserveTokens } = await import('@/lib/ratelimit')
    await expect(checkAndReserveTokens('user_pro', 'pro', 500)).resolves.toEqual({ allowed: true })
    await expect(checkAndReserveTokens('user_rec', 'recruiting', 500)).resolves.toEqual({ allowed: true })
  })
})
