import { beforeEach, describe, expect, it, vi } from 'vitest'

const capture = vi.fn(async () => {})
vi.mock('@/lib/posthog-server', () => ({ capturePostHogEvent: capture }))
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))

// The real template module is replaced: no Resend call, the test decides
// whether the send was delivered or suppressed (recipient unsubscribed).
const sendReport = vi.fn()
vi.mock('@/lib/resend', () => ({ sendAnonymousScanReportEmail: sendReport }))

// email_events: the lock insert succeeds, the status update is recorded.
const statusUpdates: unknown[] = []
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: () => ({
      insert: async () => ({ error: null }),
      update: (values: { status: string }) => {
        statusUpdates.push(values.status)
        return { eq: async () => ({ error: null }) }
      },
    }),
  }),
}))

const SCAN = '11111111-2222-3333-4444-555555555555'

const REPORT = {
  scanId: SCAN,
  email: 'visitor@example.ro',
  locale: 'ro' as const,
  analyticsDistinctId: 'ph-browser-1',
  overallScore: 61,
  grade: 'Fair',
  categories: {
    ats_formatting: { score: 20, max: 25 },
    structure: { score: 18, max: 25 },
    keyword_impact: { score: 8, max: 25 },
    clarity: { score: 15, max: 25 },
  },
  issues: [{ issue: 'No metrics', explanation: 'Bullets have no numbers.' }],
}

describe('sendAnonymousScanReportEmailIfEligible (suppression)', () => {
  beforeEach(() => {
    capture.mockClear()
    sendReport.mockReset()
    statusUpdates.length = 0
  })

  it('does not fire anon_email_sent for an unsubscribed (suppressed) recipient', async () => {
    const { sendAnonymousScanReportEmailIfEligible } = await import('@/lib/anonymous-scan-emails')
    sendReport.mockResolvedValue({ success: true, suppressed: true })

    await sendAnonymousScanReportEmailIfEligible(REPORT)

    expect(capture).not.toHaveBeenCalled()
    expect(statusUpdates).toEqual(['suppressed'])
  })

  it('fires anon_email_sent once the email was actually delivered', async () => {
    const { sendAnonymousScanReportEmailIfEligible } = await import('@/lib/anonymous-scan-emails')
    sendReport.mockResolvedValue({ success: true, providerId: 're_123' })

    await sendAnonymousScanReportEmailIfEligible(REPORT)

    expect(capture).toHaveBeenCalledTimes(1)
    expect(statusUpdates).toEqual(['sent'])
  })
})

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
