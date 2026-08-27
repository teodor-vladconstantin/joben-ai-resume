// Thin proxy client for calling resume-parser-service (Hetzner) from
// server-side Next.js code. Mirrors the candidate-resolution + shared-secret
// pattern already used by `/api/parse` (src/app/api/parse/route.ts) — kept as
// a separate helper instead of refactoring that route, since it is unrelated
// to this change and already works.

const DEFAULT_PARSER_URL = 'http://resume-parser:8000'
const REQUEST_TIMEOUT_MS = 15_000

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

function buildParserHeaders(): Headers {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const sharedSecret = process.env.RESUME_PARSER_SHARED_SECRET
  if (sharedSecret) {
    headers.set('Authorization', `Bearer ${sharedSecret}`)
  }
  return headers
}

/**
 * POSTs a JSON body to a resume-parser-service endpoint, trying each
 * configured candidate URL in turn. Throws on total failure — callers that
 * treat the parser as optional (e.g. skill-gap analysis) should catch and
 * degrade gracefully rather than fail the whole request.
 */
export async function callResumeParserJson<T>(path: string, body: unknown): Promise<T> {
  const candidates = resolveParserCandidates()
  let lastError: unknown = null

  for (const baseUrl of candidates) {
    const url = `${baseUrl}${path}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: buildParserHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Resume parser responded with status ${response.status}`)
      }

      return (await response.json()) as T
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timeout)
    }
  }

  const message =
    lastError instanceof Error && lastError.message ? lastError.message : 'Resume parser unavailable'
  throw new Error(message)
}
