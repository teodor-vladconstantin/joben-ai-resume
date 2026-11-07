import { beforeEach, describe, expect, it, vi } from 'vitest'

const { checkRouteRateLimitMock, upsertMock, updateMock, captureMock, captchaMock } = vi.hoisted(() => ({
  checkRouteRateLimitMock: vi.fn(),
  upsertMock: vi.fn(),
  updateMock: vi.fn(),
  captureMock: vi.fn(),
  captchaMock: vi.fn(),
}))

vi.mock('@/lib/security/turnstile', () => ({ verifyTurnstileToken: captchaMock }))

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
      update: (values: unknown) => {
        updateMock(values)
        return { eq: () => ({ is: () => Promise.resolve({ error: null }) }) }
      },
    }),
  }),
}))

import { POST } from '@/app/api/public/template-lead/route'

const valid = { email: 'Ana@Example.com', templateId: 'classic', locale: 'ro', termsAccepted: true, marketingConsent: false, captchaToken: 'tok' }

function request(body: unknown) {
  return new Request('http://localhost/api/public/template-lead', { method: 'POST', body: JSON.stringify(body) })
}

describe('POST /api/public/template-lead', () => {
  beforeEach(() => {
    checkRouteRateLimitMock.mockReset().mockResolvedValue({ ok: true, remaining: 10, resetAt: 0, retryAfter: 0 })
    upsertMock.mockReset().mockResolvedValue({ error: null })
    updateMock.mockReset()
    captureMock.mockReset()
    captchaMock.mockReset().mockResolvedValue(true)
  })

  it('confirms a consenting lead on the spot, with no confirmation email', async () => {
    await POST(request({ ...valid, marketingConsent: true }))
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ marketing_consent: true, email_confirmed_at: expect.any(String) }))

    updateMock.mockReset()
    await POST(request({ ...valid, marketingConsent: false }))
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('rejects a failed captcha before touching the database', async () => {
    captchaMock.mockResolvedValue(false)
    const res = await POST(request({ ...valid, marketingConsent: true }))
    expect(res.status).toBe(400)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('rejects a missing captcha token', async () => {
    const res = await POST(request({ ...valid, captchaToken: undefined }))
    expect(res.status).toBe(400)
    expect(upsertMock).not.toHaveBeenCalled()
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
