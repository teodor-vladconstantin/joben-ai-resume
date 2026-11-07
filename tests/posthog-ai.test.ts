import { afterEach, describe, expect, it, vi } from 'vitest'

const { flushMock, constructed } = vi.hoisted(() => ({
  flushMock: vi.fn(),
  constructed: [] as Array<{ apiKey: string; options: Record<string, unknown> }>,
}))

vi.mock('posthog-node', () => ({
  PostHog: class {
    flush = flushMock
    constructor(apiKey: string, options: Record<string, unknown>) {
      constructed.push({ apiKey, options })
    }
  },
}))

import { flushPostHogAi, POSTHOG_AI_PRIVATE } from '@/lib/posthog-ai'

afterEach(() => {
  vi.useRealTimers()
  flushMock.mockReset()
})

describe('posthogAi client', () => {
  it('is created with privacyMode on and disabled without a token', () => {
    expect(constructed).toHaveLength(1)
    expect(constructed[0].options.privacyMode).toBe(true)
    expect(constructed[0].options.disabled).toBe(true)
    expect(constructed[0].apiKey).toBe('phc_disabled')
  })

  it('asks for privacy mode on every request it is spread into', () => {
    expect(POSTHOG_AI_PRIVATE).toEqual({ posthogPrivacyMode: true })
  })
})

describe('flushPostHogAi', () => {
  it('gives up after the timeout when the flush never completes', async () => {
    vi.useFakeTimers()
    flushMock.mockReturnValue(new Promise(() => undefined))
    let done = false
    const pending = flushPostHogAi().then(() => {
      done = true
    })

    await vi.advanceTimersByTimeAsync(1400)
    expect(done).toBe(false)

    await vi.advanceTimersByTimeAsync(200)
    await pending
    expect(done).toBe(true)
  })

  it('resolves as soon as the flush completes', async () => {
    flushMock.mockResolvedValue(undefined)
    await expect(flushPostHogAi()).resolves.toBeUndefined()
    expect(flushMock).toHaveBeenCalledTimes(1)
  })

  it('swallows a failed flush', async () => {
    flushMock.mockRejectedValue(new Error('network down'))
    await expect(flushPostHogAi()).resolves.toBeUndefined()
  })
})
