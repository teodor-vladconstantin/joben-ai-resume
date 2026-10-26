import { beforeEach, describe, expect, it, vi } from 'vitest'

const { checkRouteRateLimitMock, extractDocxMock, captureMock } = vi.hoisted(() => ({
  checkRouteRateLimitMock: vi.fn(),
  extractDocxMock: vi.fn(),
  captureMock: vi.fn(),
}))

vi.mock('@/lib/security/route-rate-limit', () => ({
  checkRouteRateLimit: checkRouteRateLimitMock,
  resolveRateLimitIdentity: () => 'ip:test',
}))
vi.mock('@/lib/security/file-signature', () => ({ hasExpectedSignature: () => true }))
vi.mock('@/lib/docx-text-extract', () => ({
  extractTextFromDocx: extractDocxMock,
  DocxTextExtractError: class extends Error {},
}))
vi.mock('@/lib/pdf-text-extract', () => ({
  extractTextFromPdf: vi.fn(),
  PdfTextExtractError: class extends Error {},
}))
vi.mock('@/lib/posthog-server', () => ({
  capturePostHogEvent: captureMock,
  toBrowserDistinctId: (v: unknown) => (typeof v === 'string' && v ? v : null),
  toBrowserSessionId: (v: unknown) => (typeof v === 'string' && v ? v : null),
}))

import { POST } from '@/app/api/public/ats-fast-check/route'

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function request(fields: Record<string, string>, withFile = true) {
  const form = new FormData()
  if (withFile) form.append('file', new File(['PK fake docx'], 'cv.docx', { type: DOCX }))
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  return new Request('http://localhost/api/public/ats-fast-check', { method: 'POST', body: form })
}

describe('POST /api/public/ats-fast-check', () => {
  beforeEach(() => {
    checkRouteRateLimitMock.mockReset().mockResolvedValue({ ok: true, remaining: 10, resetAt: 0, retryAfter: 0 })
    extractDocxMock.mockReset().mockResolvedValue(
      'Experience\nLed a team of 5 engineers using React, Git and Docker in 2021 and 2022.\nSkills: TypeScript, Node.js'
    )
    captureMock.mockReset()
  })

  it('returns 429 with a code when rate limited, before reading the body', async () => {
    checkRouteRateLimitMock.mockResolvedValue({ ok: false, remaining: 0, resetAt: 0, retryAfter: 30 })
    const res = await POST(request({ jobSlug: 'software-engineer' }))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('30')
    expect(await res.json()).toMatchObject({ error: 'rate_limited' })
    expect(extractDocxMock).not.toHaveBeenCalled()
  })

  it('rejects requests without a known role', async () => {
    const missing = await POST(request({}))
    expect(missing.status).toBe(400)
    const unknown = await POST(request({ jobSlug: 'astronaut' }))
    expect(unknown.status).toBe(400)
    expect(extractDocxMock).not.toHaveBeenCalled()
  })

  it('returns the score and a real keyword match for the role', async () => {
    const res = await POST(request({ jobSlug: 'software-engineer', locale: 'en', distinctId: 'ph_123' }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { result: { overallScore: number }; keywordMatch: { foundKeywords: string[] } }
    expect(body.result.overallScore).toBeGreaterThan(0)
    expect(body.keywordMatch.foundKeywords).toEqual(expect.arrayContaining(['React', 'Git', 'Docker', 'TypeScript']))
    expect(captureMock).toHaveBeenCalledWith(expect.objectContaining({ distinctId: 'ph_123' }))
  })

  it('sends no analytics without a browser id', async () => {
    await POST(request({ jobSlug: 'software-engineer' }))
    expect(captureMock).not.toHaveBeenCalled()
  })
})
