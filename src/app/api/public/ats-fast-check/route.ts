import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { hasExpectedSignature } from '@/lib/security/file-signature'
import { extractTextFromPdf, PdfTextExtractError } from '@/lib/pdf-text-extract'
import { extractTextFromDocx, DocxTextExtractError } from '@/lib/docx-text-extract'
import { analyzeResumeTextLightweight } from '@/lib/ats-fast-parser'
import { calculateJobKeywordMatch, getSeoJobBySlug } from '@/data/seo-jobs'
import { capturePostHogEvent, toBrowserDistinctId, toBrowserSessionId } from '@/lib/posthog-server'
import type { AppLocale } from '@/i18n/routing'

export const runtime = 'nodejs'
export const maxDuration = 15

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx'])
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

// The client maps these codes to localized messages (FastAts.errors.*).
export type FastAtsErrorCode =
  | 'rate_limited'
  | 'invalid_input'
  | 'file_too_large'
  | 'unsupported_type'
  | 'unreadable'
  | 'too_little_text'
  | 'server'

function errorResponse(code: FastAtsErrorCode, status: number, requestId: string, headers?: Record<string, string>) {
  const res = jsonWithRequestId({ error: code }, status, requestId)
  if (headers) for (const [k, v] of Object.entries(headers)) res.headers.set(k, v)
  return res
}

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : ''
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)

  try {
    // No LLM cost, but PDF parsing is CPU: cap per IP before reading the body.
    const limit = await checkRouteRateLimit({
      name: 'public-ats-fast-check',
      identifier: resolveRateLimitIdentity(req),
      limit: 20,
      windowSeconds: 60 * 60,
      failClosed: true,
    })
    if (!limit.ok) {
      return errorResponse('rate_limited', 429, requestId, { 'Retry-After': String(limit.retryAfter) })
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return errorResponse('invalid_input', 400, requestId)
    }

    // The only caller is the role-page widget, which always names a role from
    // src/data/seo-jobs.ts; the response is a real keyword match against it.
    const jobSlug = formData.get('jobSlug')
    const locale: AppLocale = formData.get('locale') === 'en' ? 'en' : 'ro'
    const job = typeof jobSlug === 'string' && jobSlug ? getSeoJobBySlug(jobSlug, locale) : undefined
    const file = formData.get('file')
    if (!job || !(file instanceof File) || file.size === 0) {
      return errorResponse('invalid_input', 400, requestId)
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return errorResponse('file_too_large', 413, requestId)
    }

    const extension = getFileExtension(file.name || '')
    if (!ALLOWED_EXTENSIONS.has(extension) || (file.type && !ALLOWED_MIME_TYPES.has(file.type))) {
      return errorResponse('unsupported_type', 415, requestId)
    }

    let fileBytes: Uint8Array | null = new Uint8Array(await file.arrayBuffer())
    if (!hasExpectedSignature(fileBytes, extension)) {
      return errorResponse('unsupported_type', 415, requestId)
    }

    let rawText = ''
    try {
      rawText = extension === '.docx'
        ? await extractTextFromDocx(fileBytes)
        : await extractTextFromPdf(fileBytes)
    } catch (error) {
      const message = error instanceof PdfTextExtractError || error instanceof DocxTextExtractError
        ? error.message
        : 'Unknown error'
      logger.warn('Fast ATS check text extraction failed', {
        requestId,
        route: '/api/public/ats-fast-check',
        extension,
        error: message,
      })
      return errorResponse('unreadable', 422, requestId)
    } finally {
      fileBytes = null
    }

    if (rawText.trim().length < 50) {
      return errorResponse('too_little_text', 422, requestId)
    }

    const analysis = analyzeResumeTextLightweight(rawText)
    const keywordMatch = calculateJobKeywordMatch(rawText, job, locale)
    rawText = ''

    // Only analytics for visitors whose browser sent its PostHog id; no shared
    // catch-all id that would merge every anonymous visitor into one person.
    const browserDistinctId = toBrowserDistinctId(formData.get('distinctId'))
    const browserSessionId = toBrowserSessionId(formData.get('sessionId'))
    if (browserDistinctId) {
      await capturePostHogEvent({
        distinctId: browserDistinctId,
        event: 'fast_ats_check_completed',
        properties: {
          score: analysis.overallScore,
          grade: analysis.grade,
          issuesCount: analysis.issues.length,
          jobSlug: job.slug.en,
          jobMatch: keywordMatch.matchPercentage,
          ...(browserSessionId ? { $session_id: browserSessionId } : {}),
        },
      })
    }

    return jsonWithRequestId({ success: true, result: analysis, keywordMatch }, 200, requestId)
  } catch (error) {
    logger.error('Fast ATS check top-level failure', {
      requestId,
      route: '/api/public/ats-fast-check',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return errorResponse('server', 500, requestId)
  }
}
