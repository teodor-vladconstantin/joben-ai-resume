import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const DEFAULT_PARSER_URL = 'http://resume-parser:8000'
const REQUEST_TIMEOUT_MS = 45_000

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

async function parseUpstreamPayload(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { detail: text }
  }
}

async function fetchParser(path: '/parse' | '/health', init: RequestInit): Promise<UpstreamResult> {
  const candidates = resolveParserCandidates()
  let lastError: unknown = null

  for (const baseUrl of candidates) {
    const url = `${baseUrl}${path}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
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

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  try {
    const { response } = await fetchParser('/parse', {
      method: 'POST',
      body: formData,
    })

    const data = await parseUpstreamPayload(response)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const detail = error instanceof Error && error.message ? error.message : 'Resume parser service unavailable'
    return NextResponse.json({ detail }, { status: 503 })
  }
}

export async function GET() {
  try {
    const { response } = await fetchParser('/health', { method: 'GET' })
    const data = await parseUpstreamPayload(response)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const detail = error instanceof Error && error.message ? error.message : 'Resume parser service unavailable'
    return NextResponse.json({ detail }, { status: 503 })
  }
}
