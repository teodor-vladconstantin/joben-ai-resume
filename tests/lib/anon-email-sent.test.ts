import { beforeEach, describe, expect, it, vi } from 'vitest'

const capture = vi.fn(async () => {})
vi.mock('@/lib/posthog-server', () => ({ capturePostHogEvent: capture }))
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const SCAN = '11111111-2222-3333-4444-555555555555'

describe('captureAnonEmailSent (cookie consent)', () => {
  beforeEach(() => capture.mockClear())

  it('captures nothing when the visitor refused analytics cookies (no stored browser id)', async () => {
    const { captureAnonEmailSent } = await import('@/lib/anonymous-scan-emails')
    await captureAnonEmailSent({ analyticsDistinctId: null, type: '48h', scanId: SCAN, locale: 'ro' })
    expect(capture).not.toHaveBeenCalled()
  })

  it('captures under the stored browser id when they accepted', async () => {
    const { captureAnonEmailSent } = await import('@/lib/anonymous-scan-emails')
    await captureAnonEmailSent({ analyticsDistinctId: 'ph-browser-1', type: '7d', scanId: SCAN, locale: 'en' })
    expect(capture).toHaveBeenCalledWith({
      distinctId: 'ph-browser-1',
      event: 'anon_email_sent',
      properties: { type: '7d', scanId: SCAN, locale: 'en' },
    })
  })
})
