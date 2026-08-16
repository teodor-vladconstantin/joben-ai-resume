import { createServerClient } from '@/lib/supabase/server'
import { sendAnonymousScanReportEmail } from '@/lib/resend'
import { logger } from '@/lib/logger'
import { isDisposableEmailDomain } from '@/lib/security/disposable-email'

type AtsCategoryKey = 'ats_formatting' | 'structure' | 'keyword_impact' | 'clarity'

const ANON_SCAN_REPORT_EMAIL_TYPE = 'anon_scan_report'

function isDuplicateError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

type ScanReportInput = {
  scanId: string
  email: string
  overallScore: number
  grade: string
  categories: Record<AtsCategoryKey, { score: number; max: number }>
  issues: { issue: string; explanation: string }[]
}

// Same idempotency/dedup pattern as sendRateLimitEmailIfEligible (email-automation.ts):
// insert a 'processing' email_events row as a claim lock, rely on the unique
// (user_clerk_id, email_type, source_event_id) index to make a retry a no-op.
// There is no real Clerk user here, so user_clerk_id is a synthetic
// `anon:<scanId>` id, which keeps the same unique index working correctly
// (a real NULL there would never collide with another NULL in Postgres).
export async function sendAnonymousScanReportEmailIfEligible(input: ScanReportInput): Promise<void> {
  // Defensive re-check: the caller (POST /api/public/ats-check) already
  // screens disposable domains before reaching this function, but this is
  // the actual email-sending boundary, so it re-verifies rather than trust
  // the caller unconditionally.
  if (isDisposableEmailDomain(input.email)) {
    return
  }

  try {
    const supabase = createServerClient()
    const userClerkId = `anon:${input.scanId}`
    const sourceEventId = `anon-scan-report:${input.scanId}`

    const { error: lockError } = await supabase.from('email_events').insert({
      user_clerk_id: userClerkId,
      email: input.email,
      email_type: ANON_SCAN_REPORT_EMAIL_TYPE,
      status: 'processing',
      source_event_id: sourceEventId,
      metadata: { source: 'anonymous_scan_report', scanId: input.scanId },
    })

    if (lockError) {
      if (isDuplicateError(lockError)) {
        return
      }
      logger.warn('Anonymous scan report email lock failed', {
        source: 'sendAnonymousScanReportEmailIfEligible',
        scanId: input.scanId,
        error: lockError.message,
      })
      return
    }

    const result = await sendAnonymousScanReportEmail({
      to: input.email,
      overallScore: input.overallScore,
      grade: input.grade,
      categories: input.categories,
      issues: input.issues,
    })

    const { error: updateError } = await supabase
      .from('email_events')
      .update({
        status: result.success ? 'sent' : 'failed',
        provider_id: result.providerId || null,
        error: result.error || null,
        metadata: { source: 'anonymous_scan_report', scanId: input.scanId },
      })
      .eq('source_event_id', sourceEventId)

    if (updateError) {
      logger.warn('Anonymous scan report email event update failed', {
        source: 'sendAnonymousScanReportEmailIfEligible',
        scanId: input.scanId,
        error: updateError.message,
      })
    }
  } catch (error) {
    logger.warn('Anonymous scan report email send failed', {
      source: 'sendAnonymousScanReportEmailIfEligible',
      scanId: input.scanId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
