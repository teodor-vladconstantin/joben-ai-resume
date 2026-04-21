import { beforeEach, describe, expect, it, vi } from 'vitest'

const createMessageMock = vi.fn()

const checkAndReserveTokensMock = vi.fn()
const checkFeatureLimitMock = vi.fn()
const getMonthlyResetAtIsoMock = vi.fn()
const getPlanLimitsMock = vi.fn()
const getRateLimitStatusMock = vi.fn()
const incrementFeatureCounterMock = vi.fn()
const recordLimitHitMock = vi.fn()
const recordTokenUsageMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    messages = {
      create: createMessageMock,
    }
  },
}))

vi.mock('@/lib/ratelimit', () => ({
  checkAndReserveTokens: checkAndReserveTokensMock,
  checkFeatureLimit: checkFeatureLimitMock,
  getMonthlyResetAtIso: getMonthlyResetAtIsoMock,
  getPlanLimits: getPlanLimitsMock,
  getRateLimitStatus: getRateLimitStatusMock,
  incrementFeatureCounter: incrementFeatureCounterMock,
  recordLimitHit: recordLimitHitMock,
  recordTokenUsage: recordTokenUsageMock,
}))

describe('callAnthropicWithLimits', () => {
  beforeEach(() => {
    vi.resetModules()
    createMessageMock.mockReset()
    checkAndReserveTokensMock.mockReset()
    checkFeatureLimitMock.mockReset()
    getMonthlyResetAtIsoMock.mockReset()
    getPlanLimitsMock.mockReset()
    getRateLimitStatusMock.mockReset()
    incrementFeatureCounterMock.mockReset()
    recordLimitHitMock.mockReset()
    recordTokenUsageMock.mockReset()

    getMonthlyResetAtIsoMock.mockReturnValue('2026-05-01T00:00:00Z')
    getPlanLimitsMock.mockReturnValue({
      tokenBudget: 60_000,
      hardCapTokens: 1_500_000,
      maxInputTokensPerCall: 8_000,
      maxOutputTokensPerCall: 2_000,
      maxRawChars: 32_000,
      covers: 5,
      jds: 5,
      bullets: 30,
      cvs: 1,
    })

    checkFeatureLimitMock.mockResolvedValue({
      allowed: true,
      used: 0,
      limit: 30,
      blocked: false,
    })
    checkAndReserveTokensMock.mockResolvedValue({ allowed: true })
    getRateLimitStatusMock.mockResolvedValue({ tokens: { remaining: 1200 } })
    createMessageMock.mockResolvedValue({
      content: [{ type: 'text', text: '{"ok":true}' }],
      usage: {
        input_tokens: 100,
        output_tokens: 55,
      },
    })
  })

  it('throws input_too_long when raw chars exceed max', async () => {
    const { callAnthropicWithLimits, RateLimitExceededError } = await import('@/lib/anthropic-with-limits')

    await expect(
      callAnthropicWithLimits({
        userId: 'user_1',
        plan: 'free',
        inputText: 'x'.repeat(32_001),
        messages: [{ role: 'user', content: 'hello' }],
        system: 'sys',
      })
    ).rejects.toBeInstanceOf(RateLimitExceededError)

    try {
      await callAnthropicWithLimits({
        userId: 'user_1',
        plan: 'free',
        inputText: 'x'.repeat(32_001),
        messages: [{ role: 'user', content: 'hello' }],
        system: 'sys',
      })
    } catch (error) {
      const typed = error as { payload?: { limitType?: string } }
      expect(typed.payload?.limitType).toBe('input_too_long')
    }

    expect(createMessageMock).not.toHaveBeenCalled()
  })

  it('throws blocked when feature is admin-blocked', async () => {
    checkFeatureLimitMock.mockResolvedValueOnce({
      allowed: false,
      used: 2,
      limit: 5,
      blocked: true,
    })

    const { callAnthropicWithLimits } = await import('@/lib/anthropic-with-limits')

    await expect(
      callAnthropicWithLimits({
        userId: 'user_2',
        plan: 'free',
        feature: 'covers',
        inputText: 'short input',
        messages: [{ role: 'user', content: 'hello' }],
        system: 'sys',
      })
    ).rejects.toMatchObject({
      payload: {
        limitType: 'blocked',
        feature: 'covers',
      },
    })

    expect(recordLimitHitMock).toHaveBeenCalledWith('user_2', 'covers')
    expect(createMessageMock).not.toHaveBeenCalled()
  })

  it('throws tokens when monthly budget is exhausted', async () => {
    checkAndReserveTokensMock.mockResolvedValueOnce({
      allowed: false,
      limitType: 'tokens',
    })

    const { callAnthropicWithLimits } = await import('@/lib/anthropic-with-limits')

    await expect(
      callAnthropicWithLimits({
        userId: 'user_3',
        plan: 'free',
        inputText: 'short input',
        messages: [{ role: 'user', content: 'hello' }],
        system: 'sys',
      })
    ).rejects.toMatchObject({
      payload: {
        limitType: 'tokens',
      },
    })

    expect(recordLimitHitMock).toHaveBeenCalledWith('user_3', 'tokens')
    expect(createMessageMock).not.toHaveBeenCalled()
  })

  it('records usage and increments feature on success', async () => {
    const { callAnthropicWithLimits } = await import('@/lib/anthropic-with-limits')

    const response = await callAnthropicWithLimits({
      userId: 'user_4',
      plan: 'pro',
      feature: 'bullets',
      inputText: 'short input',
      messages: [{ role: 'user', content: 'hello' }],
      system: 'sys',
    })

    expect(response).toMatchObject({
      content: [{ type: 'text', text: '{"ok":true}' }],
    })

    expect(createMessageMock).toHaveBeenCalledTimes(1)
    expect(createMessageMock.mock.calls[0][0]).toMatchObject({
      max_tokens: 1200,
    })
    expect(recordTokenUsageMock).toHaveBeenCalledWith('user_4', 100, 55)
    expect(incrementFeatureCounterMock).toHaveBeenCalledWith('user_4', 'bullets')
  })
})
