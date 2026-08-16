import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getRedisClient } from '@/lib/ratelimit'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { sanitizeForPrompt } from '@/lib/security/prompt-sanitizer'
import { isDisposableEmailDomain } from '@/lib/security/disposable-email'
import { ClaudeJsonParseError, parseClaudeJsonText } from '@/lib/claude-json'
import { sanitizeAiError } from '@/lib/ai-errors'
import { extractTextFromPdf, PdfTextExtractError } from '@/lib/pdf-text-extract'
import { extractTextFromDocx, DocxTextExtractError } from '@/lib/docx-text-extract'
import { capturePostHogEvent } from '@/lib/posthog-server'

export const runtime = 'nodejs'
export const maxDuration = 30

// SECURITY: no Clerk auth on this route at all — never read/write `users` or
// `resumes`. The only persistent side effect is the optional email capture
// into `anonymous_scans` (see migration 20260816000000). Uploaded PDF/DOCX
// bytes and extracted text are never written to disk or a DB.
const ANTHROPIC_TIMEOUT_MS = 30_000
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: ANTHROPIC_TIMEOUT_MS,
})
const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'

// SECURITY: align with the in-builder upload guard (5 MB). Both formats are
// extracted locally (pdfjs-dist / mammoth) — never routed through the paid
// LlamaParse-backed /api/parse pipeline, which anonymous traffic must not reach.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx'])
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const ATS_CHECK_RATE_LIMIT_PER_DAY = 3
const MAX_RESUME_CHARS = 8_000
const MIN_RESUME_CHARS = 100
const MAX_OUTPUT_TOKENS = 500

const emailSchema = z.string().trim().toLowerCase().email().max(254)

const ATS_CHECK_SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) resume scanner. Analyze the resume text and return ONLY valid JSON, no markdown, no preamble, no text outside the JSON object.

Score across exactly 4 categories, 25 points each (total 100):
- ats_formatting: how cleanly this would parse in ATS software — clear section headings, no reliance on tables/columns/graphics/images for content, no critical info in headers/footers.
- structure: presence and logical order of standard sections (contact info, experience, education, skills), consistent and unambiguous date formatting.
- keyword_impact: use of concrete, role-relevant keywords and quantifiable achievements (numbers, metrics, outcomes) instead of vague duty descriptions.
- clarity: concise, readable bullets and sentences, no wall-of-text paragraphs, consistent tense.

Be strict. 85+ overall should be rare. A resume with no numbers or metrics anywhere should not score above 15 in keyword_impact.

List at most 3 concrete issues, each with a ONE-sentence explanation (max ~20 words). If there are fewer than 3 real issues, return fewer items — do not pad with minor nitpicks.

Return exactly this JSON shape, nothing else:
{
  "overall_score": int,
  "grade": "Poor|Fair|Good|Excellent",
  "categories": {
    "ats_formatting": { "score": int, "max": 25 },
    "structure": { "score": int, "max": 25 },
    "keyword_impact": { "score": int, "max": 25 },
    "clarity": { "score": int, "max": 25 }
  },
  "issues": [
    { "issue": "string", "explanation": "string" }
  ]
}`

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : ''
}

function extractOverallScore(result: unknown): number | null {
  if (result && typeof result === 'object' && 'overall_score' in result) {
    const value = (result as { overall_score?: unknown }).overall_score
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(100, Math.round(value)))
    }
  }
  return null
}

async function storeOptionalEmail(email: string, overallScore: number | null, ipHash: string | null): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await supabase.from('anonymous_scans').insert({
    email,
    overall_score: overallScore,
    ip_hash: ipHash,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)

  try {
    // SECURITY: fail-closed, not the app's usual fail-open policy — this
    // route has no auth gate at all, so a Redis outage must not turn into
    // unlimited free AI calls. Mirrors /api/signup/consent.
    const redis = getRedisClient()
    if (!redis) {
      logger.error('Public ATS check unavailable: Redis not configured', {
        requestId,
        route: '/api/public/ats-check',
      })
      return jsonWithRequestId({ error: clientErrorMessage('unavailable') }, 503, requestId)
    }

    // Identity is cheap to resolve (header parsing + hashing, no Redis I/O)
    // so it's computed here; the actual rate-limit check/increment happens
    // later, only once the upload has proven processable — see below.
    const identity = resolveRateLimitIdentity(req)

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

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
    if (!ALLOWED_EXTENSIONS.has(extension) || (file.type && !ALLOWED_MIME_TYPES.has(file.type))) {
      return jsonWithRequestId(
        { error: clientErrorMessage('invalid_input', 'Only .pdf and .docx files are supported.') },
        415,
        requestId
      )
    }

    // The CV never touches disk or a DB: it lives only in these local
    // variables for the duration of this single request, and is dropped
    // (reference cleared) as soon as we're done with each stage.
    let fileBytes: Uint8Array | null = new Uint8Array(await file.arrayBuffer())
    let rawText: string
    try {
      rawText = extension === '.docx'
        ? await extractTextFromDocx(fileBytes)
        : await extractTextFromPdf(fileBytes)
    } catch (error) {
      const message = error instanceof PdfTextExtractError || error instanceof DocxTextExtractError
        ? error.message
        : 'Unknown error'
      logger.warn('ATS check: text extraction failed', {
        requestId,
        route: '/api/public/ats-check',
        extension,
        error: message,
      })
      return jsonWithRequestId(
        {
          error: clientErrorMessage(
            'invalid_input',
            extension === '.docx'
              ? 'Could not read text from this DOCX file.'
              : 'Could not read text from this PDF. Make sure it is not a scanned image.'
          ),
        },
        422,
        requestId
      )
    } finally {
      fileBytes = null
    }

    const safeResumeText = sanitizeForPrompt(rawText, { maxChars: MAX_RESUME_CHARS })
    rawText = ''

    if (safeResumeText.length < MIN_RESUME_CHARS) {
      return jsonWithRequestId(
        { error: clientErrorMessage('invalid_input', 'Could not find enough readable text in this file.') },
        422,
        requestId
      )
    }

    // Rate limit checked/incremented here, right before the paid AI call —
    // not earlier. A file that fails validation or extraction above never
    // reaches this point, so it never costs the visitor one of their 3
    // daily scans; only an upload that actually produced usable text does.
    const limit = await checkRouteRateLimit({
      name: 'public-ats-check',
      identifier: identity,
      limit: ATS_CHECK_RATE_LIMIT_PER_DAY,
      windowSeconds: 24 * 60 * 60,
    })

    if (!limit.ok) {
      logger.warn('Public ATS check rate-limit hit', {
        requestId,
        route: '/api/public/ats-check',
        retryAfter: limit.retryAfter,
      })
      return new Response(
        JSON.stringify({ error: clientErrorMessage('rate_limit', 'Free scan limit reached. Try again in 24h.') }),
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

    let result: unknown
    try {
      const message = await anthropic.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.2,
        system: ATS_CHECK_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Resume:\n${safeResumeText}` }],
      })

      const textBlock = message.content.find((block) => block.type === 'text')
      const analysisText = textBlock && textBlock.type === 'text' ? textBlock.text : ''
      result = parseClaudeJsonText(analysisText)
    } catch (error) {
      if (error instanceof ClaudeJsonParseError) {
        logger.error('ATS check: Claude returned malformed JSON', {
          requestId,
          route: '/api/public/ats-check',
          error: error.message,
        })
        return jsonWithRequestId({ error: 'AI response format was invalid. Please retry.' }, 502, requestId)
      }

      const sanitized = sanitizeAiError(error)
      logger.error('ATS check: provider call failed', {
        requestId,
        route: '/api/public/ats-check',
        category: sanitized.category,
        raw: sanitized.raw,
      })
      const status = sanitized.category === 'rate_limit' ? 429 : 503
      return jsonWithRequestId({ error: sanitized.userMessage }, status, requestId)
    }

    const overallScore = extractOverallScore(result)
    const ipHash = identity.startsWith('ip:') ? identity.slice(3) : null

    const emailRaw = formData.get('email')
    if (typeof emailRaw === 'string' && emailRaw.trim().length > 0) {
      const parsedEmail = emailSchema.safeParse(emailRaw)
      if (parsedEmail.success && !isDisposableEmailDomain(parsedEmail.data)) {
        try {
          await storeOptionalEmail(parsedEmail.data, overallScore, ipHash)
        } catch (error) {
          // Non-blocking — the visitor still gets their score even if this fails.
          logger.warn('ATS check: failed to store optional email', {
            requestId,
            route: '/api/public/ats-check',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    await capturePostHogEvent({
      distinctId: `anon:${ipHash || 'unknown'}`,
      event: 'anonymous_ats_check_completed',
      properties: {
        hasEmail: typeof emailRaw === 'string' && emailRaw.trim().length > 0,
        overallScore,
      },
    })

    return jsonWithRequestId({ result }, 200, requestId)
  } catch (error) {
    logger.error('Public ATS check top-level failure', {
      requestId,
      route: '/api/public/ats-check',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
