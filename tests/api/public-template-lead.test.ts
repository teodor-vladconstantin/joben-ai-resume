import { beforeEach, describe, expect, it, vi } from 'vitest'

const { checkRouteRateLimitMock, upsertMock, updateMock, captureMock, insertMock, confirmEmailMock } = vi.hoisted(() => ({
  checkRouteRateLimitMock: vi.fn(),
  upsertMock: vi.fn(),
  updateMock: vi.fn(),
  captureMock: vi.fn(),
  insertMock: vi.fn(),
  confirmEmailMock: vi.fn(),
}))

vi.mock('@/lib/resend', () => ({
  sendTemplateLeadConfirmEmail: confirmEmailMock,
  toAnonScanEmailLocale: (v: string | null) => (v === 'en' ? 'en' : 'ro'),
}))

vi.mock('@/lib/security/route-rate-limit', () => ({
  checkRouteRateLimit: checkRouteRateLimitMock,
  resolveRateLimitIdentity: () => 'ip:test',
}))
vi.mock('@/lib/posthog-server', () => ({
  capturePostHogEvent: captureMock,
  toBrowserDistinctId: (v: unknown) => (typeof v === 'string' && !v.startsWith('user_') ? v : null),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      upsert: upsertMock,
      insert: insertMock,
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: { id: 'lead-1', locale: 'ro', marketing_consent: true, email_confirmed_at: null } }),
        }),
      }),
      update: (values: unknown) => {
        updateMock(values)
        return { eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }
      },
    }),
  }),
}))

import { POST } from '@/app/api/public/template-lead/route'

const valid = { email: 'Ana@Example.com', templateId: 'classic', locale: 'ro', termsAccepted: true, marketingConsent: false }

function request(body: unknown) {
  return new Request('http://localhost/api/public/template-lead', { method: 'POST', body: JSON.stringify(body) })
}

describe('POST /api/public/template-lead', () => {
  beforeEach(() => {
    checkRouteRateLimitMock.mockReset().mockResolvedValue({ ok: true, remaining: 10, resetAt: 0, retryAfter: 0 })
    upsertMock.mockReset().mockResolvedValue({ error: null })
    updateMock.mockReset()
    captureMock.mockReset()
    insertMock.mockReset().mockResolvedValue({ error: null })
    confirmEmailMock.mockReset().mockResolvedValue({ success: true, providerId: 'p1' })
  })

  it('sends one confirmation email only when marketing consent is ticked', async () => {
    await POST(request({ ...valid, marketingConsent: false }))
    expect(confirmEmailMock).not.toHaveBeenCalled()

    await POST(request({ ...valid, marketingConsent: true }))
    expect(confirmEmailMock).toHaveBeenCalledWith({ to: 'ana@example.com', leadId: 'lead-1', locale: 'ro' })
  })

  it('skips the confirmation email when the lock shows one was already sent', async () => {
    insertMock.mockResolvedValue({ error: { code: '23505', message: 'duplicate' } })
    const res = await POST(request({ ...valid, marketingConsent: true }))
    expect(res.status).toBe(200)
    expect(confirmEmailMock).not.toHaveBeenCalled()
  })

  it('rejects submissions without the terms checkbox', async () => {
    const res = await POST(request({ ...valid, termsAccepted: false }))
    expect(res.status).toBe(400)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('rejects disposable email domains', async () => {
    const res = await POST(request({ ...valid, email: 'x@mailinator.com' }))
    expect(res.status).toBe(400)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('stores a lowercased lead without marketing consent by default', async () => {
    const res = await POST(request({ ...valid, marketingConsent: undefined }))
    expect(res.status).toBe(200)
    expect(upsertMock.mock.calls[0][0]).toMatchObject({ email: 'ana@example.com', marketing_consent: false, marketing_consent_at: null })
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('records marketing consent only when ticked and drops forged distinct ids', async () => {
    const res = await POST(request({ ...valid, marketingConsent: true, posthogDistinctId: 'user_123' }))
    expect(res.status).toBe(200)
    expect(upsertMock.mock.calls[0][0]).toMatchObject({ marketing_consent: true, posthog_distinct_id: null })
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ marketing_consent: true }))
    expect(captureMock).not.toHaveBeenCalled()
  })

  it('returns 429 when rate limited', async () => {
    checkRouteRateLimitMock.mockResolvedValue({ ok: false, remaining: 0, resetAt: 0, retryAfter: 30 })
    const res = await POST(request(valid))
    expect(res.status).toBe(429)
  })
})
