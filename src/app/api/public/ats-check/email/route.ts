import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { isDisposableEmailDomain } from '@/lib/security/disposable-email'
import { capturePostHogEvent } from '@/lib/posthog-server'
import { sendAnonymousScanReportEmailIfEligible } from '@/lib/anonymous-scan-emails'

export const runtime = 'nodejs'

// SECURITY: lets a visitor who skipped the email field before scanning come
// back after seeing their score and request the same report by email.
// scanId is an unguessable gen_random_uuid() (see anonymous_scans), so the
// meaningful cost of abuse is already bounded by needing a real prior scan;
// this endpoint's own rate limit is defense in depth on top of that, not the
// primary control. The report content always comes from the row's
// report_json, never from the request body, so a caller can't use this to
// relay arbitrary text to an arbitrary address.
const EMAIL_CAPTURE_RATE_LIMIT_PER_DAY = 10

const requestSchema = z.object({
  scanId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email().max(254),
})

const reportJsonSchema = z.object({
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

export async function POST(req: Request) {
  const requestId = getRequestId(req)

  try {
    const identity = resolveRateLimitIdentity(req)
    const limit = await checkRouteRateLimit({
      name: 'public-ats-check-email',
      identifier: identity,
      limit: EMAIL_CAPTURE_RATE_LIMIT_PER_DAY,
      windowSeconds: 24 * 60 * 60,
    })

    if (!limit.ok) {
      return jsonWithRequestId(
        { error: clientErrorMessage('rate_limit', 'Too many requests. Try again later.') },
        429,
        requestId
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const { scanId, email } = parsed.data
    if (isDisposableEmailDomain(email)) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'Please use a non-disposable email address.') }, 400, requestId)
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: scan, error: fetchError } = await supabase
      .from('anonymous_scans')
      .select('id, email, report_json')
      .eq('id', scanId)
      .maybeSingle()

    if (fetchError) {
      logger.error('ATS check email: scan lookup failed', {
        requestId,
        route: '/api/public/ats-check/email',
        error: fetchError.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    if (!scan) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'Scan not found.') }, 404, requestId)
    }

    const reportJson = reportJsonSchema.safeParse(scan.report_json)
    if (!reportJson.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'This scan has no report to send.') }, 422, requestId)
    }

    // First submission wins: if the scan already has an email attached
    // (given up front, or from an earlier call to this endpoint), send to
    // that address rather than letting a second caller redirect the report
    // elsewhere. sendAnonymousScanReportEmailIfEligible's own dedup lock
    // keeps this idempotent either way.
    let finalEmail = scan.email
    if (!finalEmail) {
      const { error: updateError } = await supabase
        .from('anonymous_scans')
        .update({ email })
        .eq('id', scanId)
        .is('email', null)

      if (updateError) {
        logger.warn('ATS check email: failed to attach email to scan', {
          requestId,
          route: '/api/public/ats-check/email',
          error: updateError.message,
        })
      }
      finalEmail = email
    }

    await sendAnonymousScanReportEmailIfEligible({
      scanId,
      email: finalEmail,
      overallScore: reportJson.data.overall_score,
      grade: reportJson.data.grade,
      categories: reportJson.data.categories,
      issues: reportJson.data.issues,
    })

    await capturePostHogEvent({
      distinctId: `anon:scan:${scanId}`,
      event: 'anonymous_ats_check_email_captured_post_scan',
      properties: { overallScore: reportJson.data.overall_score },
    })

    return jsonWithRequestId({ success: true, email: finalEmail }, 200, requestId)
  } catch (error) {
    logger.error('ATS check email top-level failure', {
      requestId,
      route: '/api/public/ats-check/email',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
