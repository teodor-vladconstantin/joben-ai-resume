import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRedisClient } from '@/lib/ratelimit'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { sanitizeForPrompt } from '@/lib/security/prompt-sanitizer'
import { isDisposableEmailDomain } from '@/lib/security/disposable-email'
import { ClaudeJsonParseError, parseClaudeJsonText } from '@/lib/claude-json'
import { withCurrentDateContext } from '@/lib/ai-system-prompt'
import { sanitizeAiError } from '@/lib/ai-errors'
import { extractTextFromPdf, PdfTextExtractError } from '@/lib/pdf-text-extract'
import { extractTextFromDocx, DocxTextExtractError } from '@/lib/docx-text-extract'
import { capturePostHogEvent } from '@/lib/posthog-server'
import { sendAnonymousScanReportEmailIfEligible } from '@/lib/anonymous-scan-emails'

export const runtime = 'nodejs'
export const maxDuration = 30

// SECURITY: no Clerk auth on this route at all, never read/write `users` or
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
// extracted locally (pdfjs-dist / mammoth), never routed through the paid
// LlamaParse-backed /api/parse pipeline, which anonymous traffic must not reach.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx'])
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const ATS_CHECK_RATE_LIMIT_PER_DAY = 1
const MAX_RESUME_CHARS = 8_000
const MIN_RESUME_CHARS = 100
const MAX_OUTPUT_TOKENS = 500

// SECURITY: IP-only limiting is trivially bypassed with a VPN/proxy rotation.
// A random per-browser cookie survives an IP change, so a request is only
// allowed when BOTH the IP and the device are under the daily cap; clearing
// cookies alone still leaves the IP counter in place, and rotating IP alone
// still leaves the device counter in place. Not a fingerprint: it carries no
// information about the device itself, just a random id this route issued.
const DEVICE_COOKIE_NAME = 'jb_atsdid'
const DEVICE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400 // ~400 days, the browser-enforced cap
const DEVICE_ID_PATTERN = /^[0-9a-f-]{36}$/i

const emailSchema = z.string().trim().toLowerCase().email().max(254)

const ATS_CATEGORY_KEYS = ['ats_formatting', 'structure', 'keyword_impact', 'clarity'] as const

const AtsScanResultSchema = z.object({
  overall_score: z.number(),
  grade: z.string(),
  categories: z.object({
    ats_formatting: z.object({ score: z.number(), max: z.number() }),
    structure: z.object({ score: z.number(), max: z.number() }),
    keyword_impact: z.object({ score: z.number(), max: z.number() }),
    clarity: z.object({ score: z.number(), max: z.number() }),
  }),
  issues: z.array(z.object({ issue: z.string(), explanation: z.string() })),
})

const ATS_CHECK_SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) resume scanner. Analyze the resume text and return ONLY valid JSON, no markdown, no preamble, no text outside the JSON object.

Score across exactly 4 categories, 25 points each (total 100):
- ats_formatting: how cleanly this would parse in ATS software, clear section headings, no reliance on tables/columns/graphics/images for content, no critical info in headers/footers.
- structure: presence and logical order of standard sections (contact info, experience, education, skills), consistent and unambiguous date formatting.
- keyword_impact: use of concrete, role-relevant keywords and quantifiable achievements (numbers, metrics, outcomes) instead of vague duty descriptions.
- clarity: concise, readable bullets and sentences, no wall-of-text paragraphs, consistent tense.

Be strict. 85+ overall should be rare. A resume with no numbers or metrics anywhere should not score above 15 in keyword_impact.

List at most 3 concrete issues, each with a ONE-sentence explanation (max ~20 words). If there are fewer than 3 real issues, return fewer items, do not pad with minor nitpicks.

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

function resolveDeviceId(req: Request): string {
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${DEVICE_COOKIE_NAME}=([0-9a-f-]{36})`, 'i'))
  return match && DEVICE_ID_PATTERN.test(match[1]) ? match[1] : randomUUID()
}

function getWeakestCategory(
  categories: z.infer<typeof AtsScanResultSchema>['categories']
): (typeof ATS_CATEGORY_KEYS)[number] {
  return ATS_CATEGORY_KEYS.reduce((worst, key) => {
    const ratio = categories[key].score / categories[key].max
    const worstRatio = categories[worst].score / categories[worst].max
    return ratio < worstRatio ? key : worst
  }, ATS_CATEGORY_KEYS[0])
}

// Always called (whether or not the visitor gave an email up front) so a
// scanId exists for the post-scan "email me this report" flow
// (POST /api/public/ats-check/email) to look up later. report_json is the
// single source of truth that endpoint sends from, so the client is never
// trusted to supply report content for a scan it didn't just run.
async function storeAnonymousScan(input: {
  email: string | null
  overallScore: number | null
  ipHash: string | null
  weakestCategory: string | null
  reportJson: unknown
}): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase
    .from('anonymous_scans')
    .insert({
      email: input.email,
      overall_score: input.overallScore,
      ip_hash: input.ipHash,
      weakest_category: input.weakestCategory,
      report_json: input.reportJson,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data?.id ?? null
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const deviceId = resolveDeviceId(req)

  function withDeviceCookie(response: NextResponse): NextResponse {
    response.cookies.set(DEVICE_COOKIE_NAME, deviceId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
      path: '/',
    })
    return response
  }

  try {
    // SECURITY: fail-closed, not the app's usual fail-open policy, this
    // route has no auth gate at all, so a Redis outage must not turn into
    // unlimited free AI calls. Mirrors /api/signup/consent.
    const redis = getRedisClient()
    if (!redis) {
      logger.error('Public ATS check unavailable: Redis not configured', {
        requestId,
        route: '/api/public/ats-check',
      })
      return withDeviceCookie(jsonWithRequestId({ error: clientErrorMessage('unavailable') }, 503, requestId))
    }

    // Identity is cheap to resolve (header parsing + hashing, no Redis I/O)
    // so it's computed here; the actual rate-limit check/increment happens
    // later, only once the upload has proven processable, see below.
    const identity = resolveRateLimitIdentity(req)

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return withDeviceCookie(jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId))
    }

    const file = formData.get('file')
    if (!(file instanceof File)) {
      return withDeviceCookie(
        jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'A file upload is required.') }, 400, requestId)
      )
    }
    if (file.size === 0) {
      return withDeviceCookie(
        jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'The uploaded file is empty.') }, 400, requestId)
      )
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return withDeviceCookie(
        jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'File exceeds the 5 MB limit.') }, 413, requestId)
      )
    }

    const extension = getFileExtension(file.name || '')
    if (!ALLOWED_EXTENSIONS.has(extension) || (file.type && !ALLOWED_MIME_TYPES.has(file.type))) {
      return withDeviceCookie(
        jsonWithRequestId(
          { error: clientErrorMessage('invalid_input', 'Only .pdf and .docx files are supported.') },
          415,
          requestId
        )
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
      return withDeviceCookie(
        jsonWithRequestId(
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
      )
    } finally {
      fileBytes = null
    }

    const safeResumeText = sanitizeForPrompt(rawText, { maxChars: MAX_RESUME_CHARS })
    rawText = ''

    if (safeResumeText.length < MIN_RESUME_CHARS) {
      return withDeviceCookie(
        jsonWithRequestId(
          { error: clientErrorMessage('invalid_input', 'Could not find enough readable text in this file.') },
          422,
          requestId
        )
      )
    }

    // Rate limit checked/incremented here, right before the paid AI call,
    // not earlier. A file that fails validation or extraction above never
    // reaches this point, so it never costs the visitor one of their 3
    // daily scans; only an upload that actually produced usable text does.
    // Checked on BOTH identities (IP and device cookie) so a request is only
    // allowed when neither has exhausted its own daily quota.
    const [ipLimit, deviceLimit] = await Promise.all([
      checkRouteRateLimit({
        name: 'public-ats-check',
        identifier: identity,
        limit: ATS_CHECK_RATE_LIMIT_PER_DAY,
        windowSeconds: 24 * 60 * 60,
      }),
      checkRouteRateLimit({
        name: 'public-ats-check',
        identifier: `device:${deviceId}`,
        limit: ATS_CHECK_RATE_LIMIT_PER_DAY,
        windowSeconds: 24 * 60 * 60,
      }),
    ])

    if (!ipLimit.ok || !deviceLimit.ok) {
      const retryAfter = Math.max(ipLimit.retryAfter, deviceLimit.retryAfter)
      logger.warn('Public ATS check rate-limit hit', {
        requestId,
        route: '/api/public/ats-check',
        retryAfter,
        limitedBy: !ipLimit.ok && !deviceLimit.ok ? 'both' : !ipLimit.ok ? 'ip' : 'device',
      })
      return withDeviceCookie(
        NextResponse.json(
          { error: clientErrorMessage('rate_limit', 'Free scan limit reached. Try again in 24h.') },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'x-request-id': requestId,
            },
          }
        )
      )
    }

    let result: unknown
    try {
      const message = await anthropic.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.2,
        system: withCurrentDateContext(ATS_CHECK_SYSTEM_PROMPT),
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
        return withDeviceCookie(jsonWithRequestId({ error: 'AI response format was invalid. Please retry.' }, 502, requestId))
      }

      const sanitized = sanitizeAiError(error)
      logger.error('ATS check: provider call failed', {
        requestId,
        route: '/api/public/ats-check',
        category: sanitized.category,
        raw: sanitized.raw,
      })
      const status = sanitized.category === 'rate_limit' ? 429 : 503
      return withDeviceCookie(jsonWithRequestId({ error: sanitized.userMessage }, status, requestId))
    }

    const overallScore = extractOverallScore(result)
    const ipHash = identity.startsWith('ip:') ? identity.slice(3) : null

    // A typed parse on top of the already-JSON-valid `result`, only used to
    // safely build the immediate score-report email (category breakdown +
    // issues); the API response above always returns the raw `result`
    // unchanged, so a shape mismatch here never affects what the visitor sees.
    const typedResult = AtsScanResultSchema.safeParse(result)
    const weakestCategory = typedResult.success ? getWeakestCategory(typedResult.data.categories) : null

    const emailRaw = formData.get('email')
    let scanEmail: string | null = null
    if (typeof emailRaw === 'string' && emailRaw.trim().length > 0) {
      const parsedEmail = emailSchema.safeParse(emailRaw)
      if (parsedEmail.success && !isDisposableEmailDomain(parsedEmail.data)) {
        scanEmail = parsedEmail.data
      }
    }

    // Persisted unconditionally (not only when an email was given) so a
    // scanId always exists for the post-scan "email me this report" flow.
    // Only worth doing when the report actually parsed, that's the content
    // the follow-up endpoint would send.
    let scanId: string | null = null
    if (typedResult.success) {
      try {
        scanId = await storeAnonymousScan({
          email: scanEmail,
          overallScore,
          ipHash,
          weakestCategory,
          reportJson: typedResult.data,
        })

        if (scanId && scanEmail) {
          // Awaited (not fire-and-forget): a serverless function is not
          // guaranteed to keep running after it returns a response, so an
          // un-awaited promise here could get killed mid-send. Failures
          // inside are still non-blocking for the visitor, they're caught
          // and logged, never thrown, matching storeAnonymousScan above.
          await sendAnonymousScanReportEmailIfEligible({
            scanId,
            email: scanEmail,
            overallScore: typedResult.data.overall_score,
            grade: typedResult.data.grade,
            categories: typedResult.data.categories,
            issues: typedResult.data.issues,
          })
        }
      } catch (error) {
        // Non-blocking, the visitor still gets their score even if this fails.
        logger.warn('ATS check: failed to store anonymous scan', {
          requestId,
          route: '/api/public/ats-check',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    await capturePostHogEvent({
      distinctId: `anon:${ipHash || 'unknown'}`,
      event: 'anonymous_ats_check_completed',
      properties: {
        hasEmail: Boolean(scanEmail),
        overallScore,
      },
    })

    return withDeviceCookie(jsonWithRequestId({ result, scanId, emailSent: Boolean(scanId && scanEmail) }, 200, requestId))
  } catch (error) {
    logger.error('Public ATS check top-level failure', {
      requestId,
      route: '/api/public/ats-check',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return withDeviceCookie(jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId))
  }
}
