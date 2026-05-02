import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const ORIGINAL_RESUME_PARSER_URL = process.env.RESUME_PARSER_URL
const ORIGINAL_PUBLIC_RESUME_PARSER_URL = process.env.NEXT_PUBLIC_RESUME_PARSER_URL

function buildUploadRequest(): Request {
  const formData = new FormData()
  formData.append('file', new Blob(['dummy pdf bytes'], { type: 'application/pdf' }), 'resume.pdf')

  return new Request('http://localhost/api/parse', {
    method: 'POST',
    body: formData,
  })
}

describe('/api/parse route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env.RESUME_PARSER_URL = ORIGINAL_RESUME_PARSER_URL
    process.env.NEXT_PUBLIC_RESUME_PARSER_URL = ORIGINAL_PUBLIC_RESUME_PARSER_URL
    vi.unstubAllGlobals()
  })

  it('uses RESUME_PARSER_URL for upstream requests', async () => {
    process.env.RESUME_PARSER_URL = 'http://parser.internal:9000'
    delete process.env.NEXT_PUBLIC_RESUME_PARSER_URL

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { POST } = await import('@/app/api/parse/route')
    const response = await POST(buildUploadRequest() as unknown as NextRequest)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://parser.internal:9000/parse',
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
      }),
    )
  })

  it('falls back to NEXT_PUBLIC_RESUME_PARSER_URL when server URL is missing', async () => {
    delete process.env.RESUME_PARSER_URL
    process.env.NEXT_PUBLIC_RESUME_PARSER_URL = 'https://parser.joben.eu'

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { GET } = await import('@/app/api/parse/route')
    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ status: 'ok' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://parser.joben.eu/health',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
      }),
    )
  })

  it('retries with port 8000 when configured URL on 8001 is unreachable', async () => {
    process.env.RESUME_PARSER_URL = 'http://89.167.48.64:8001'
    delete process.env.NEXT_PUBLIC_RESUME_PARSER_URL

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ parsed: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { POST } = await import('@/app/api/parse/route')
    const response = await POST(buildUploadRequest() as unknown as NextRequest)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ parsed: true })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://89.167.48.64:8001/parse',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://89.167.48.64:8000/parse',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('returns 503 with useful detail when all parser candidates fail', async () => {
    delete process.env.RESUME_PARSER_URL
    delete process.env.NEXT_PUBLIC_RESUME_PARSER_URL

    const fetchMock = vi.fn().mockRejectedValue(new Error('parser host unreachable'))
    vi.stubGlobal('fetch', fetchMock)

    const { GET } = await import('@/app/api/parse/route')
    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload).toEqual({
      detail: 'parser host unreachable',
    })
  })
})
