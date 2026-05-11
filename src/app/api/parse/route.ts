import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'

export const maxDuration = 60

const DEFAULT_PARSER_URL = 'http://resume-parser:8000'
const REQUEST_TIMEOUT_MS = 45_000

// SECURITY: align with the in-builder upload guard (5 MB, .pdf/.docx only).
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx'])
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

// SECURITY: CLAUDE.md Critical #2 — drop anonymous traffic, throttle per
// user. The Hetzner parser bills LlamaParse credits per call so we must
// gate this aggressively.
const PARSE_RATE_LIMIT_PER_HOUR = 10

type UpstreamResult = {
  response: Response
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

function withPort(url: string, port: string): string | null {
  try {
    const parsed = new URL(url)
    parsed.port = port
    return trimTrailingSlash(parsed.toString())
  } catch {
    return null
  }
}

function resolveParserCandidates(): string[] {
  const configured = [process.env.RESUME_PARSER_URL, process.env.NEXT_PUBLIC_RESUME_PARSER_URL]
    .filter((value): value is string => Boolean(value))
    .map(trimTrailingSlash)

  const fallback = [...configured]

  for (const url of configured) {
    const to8000 = withPort(url, '8000')
    const to8001 = withPort(url, '8001')
    if (to8000) fallback.push(to8000)
    if (to8001) fallback.push(to8001)
  }

  fallback.push(DEFAULT_PARSER_URL)

  return [...new Set(fallback)]
}

function buildParserHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  // SECURITY: CLAUDE.md Critical #3 — forward shared secret so the Hetzner
  // parser can reject anonymous calls bypassing this Next.js layer.
  const sharedSecret = process.env.RESUME_PARSER_SHARED_SECRET
  if (sharedSecret) {
    headers.set('Authorization', `Bearer ${sharedSecret}`)
  }
  return headers
}

async function parseUpstreamPayload(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { detail: text }
  }
}

async function fetchParser(
  path: '/parse' | '/health',
  init: { method: string; body?: BodyInit; extraHeaders?: HeadersInit }
): Promise<UpstreamResult> {
  const candidates = resolveParserCandidates()
  let lastError: unknown = null

  for (const baseUrl of candidates) {
    const url = `${baseUrl}${path}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        method: init.method,
        body: init.body,
        headers: buildParserHeaders(init.extraHeaders),
        signal: controller.signal,
        cache: 'no-store',
      })
      return { response }
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timeout)
    }
  }

  const errorMessage =
    lastError instanceof Error && lastError.message ? lastError.message : 'Upstream parser unavailable'
  throw new Error(errorMessage)
}

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : ''
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req)

  // SECURITY: gate on Clerk auth before forwarding anything to the paid
  // parser. Anonymous requests are rejected at the edge.
  const { userId } = await auth()
  if (!userId) {
    return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
  }

  const limit = await checkRouteRateLimit({
    name: 'parse',
    identifier: resolveRateLimitIdentity(req, userId),
    limit: PARSE_RATE_LIMIT_PER_HOUR,
    windowSeconds: 3600,
  })

  if (!limit.ok) {
    logger.warn('parse rate-limit hit', {
      requestId,
      route: '/api/parse',
      userId,
      retryAfter: limit.retryAfter,
    })
    return new NextResponse(
      JSON.stringify({ error: clientErrorMessage('rate_limit') }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(limit.retryAfter),
          'x-request-id': requestId,
        },
      }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
  }

  // SECURITY: server-side validation — never trust the client to enforce
  // the file allowlist or size cap.
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'A file upload is required.') }, 400, requestId)
  }

  if (file.size === 0) {
    return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'The uploaded file is empty.') }, 400, requestId)
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'File exceeds the 5 MB limit.') }, 413, requestId)
  }

  const extension = getFileExtension(file.name || '')
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'Only .pdf and .docx files are allowed.') }, 415, requestId)
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'Unsupported file type.') }, 415, requestId)
  }

  try {
    const { response } = await fetchParser('/parse', {
      method: 'POST',
      body: formData,
    })

    const data = await parseUpstreamPayload(response)
    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
    })
  } catch (error) {
    logger.error('Resume parser upstream failed', {
      requestId,
      route: '/api/parse',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('unavailable', 'Resume parser service unavailable.') }, 503, requestId)
  }
}

export async function GET(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { response } = await fetchParser('/health', { method: 'GET' })
    const data = await parseUpstreamPayload(response)
    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
    })
  } catch (error) {
    logger.error('Resume parser health probe failed', {
      requestId,
      route: '/api/parse',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('unavailable', 'Resume parser service unavailable.') }, 503, requestId)
  }
}
