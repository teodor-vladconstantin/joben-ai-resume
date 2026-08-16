import { createServerClient } from '@/lib/supabase/server'
import { sendAnonymousScan48hEmail, type AtsCategoryKey } from '@/lib/resend'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { isDisposableEmailDomain } from '@/lib/security/disposable-email'
import {
  isAuthorizedCronRequest,
  isDuplicateKeyError,
  parseCronOptions,
  sendEmailWithRetry,
} from '@/lib/cron-utils'

export const runtime = 'nodejs'

const EVENT_SOURCE = 'cron.anonymous-scan-48h'
const EMAIL_TYPE = 'anon_scan_48h'

// Eligible once a scan is at least 48h old; MAX_AGE bounds how far back the
// query looks so a paused cron does not suddenly try to mail everyone who
// scanned in the last several months. Rows past MIN_AGE stay eligible on
// every run until they either get an account (see the users check below) or
// successfully claim the email_events lock, that lock, not a status column
// on anonymous_scans, is the single source of truth for "already sent".
const MIN_AGE_MS = 48 * 60 * 60 * 1000
const MAX_AGE_MS = 21 * 24 * 60 * 60 * 1000

type CandidateScan = {
  id: string
  email: string | null
  weakest_category: string | null
}

const VALID_CATEGORY_KEYS: readonly AtsCategoryKey[] = ['ats_formatting', 'structure', 'keyword_impact', 'clarity']

function toCategoryKey(value: string | null): AtsCategoryKey | null {
  return value && (VALID_CATEGORY_KEYS as readonly string[]).includes(value) ? (value as AtsCategoryKey) : null
}

function buildSourceEventId(scanId: string): string {
  return `anon-scan-48h:${scanId}`
}

async function sendWithRetry(input: {
  to: string
  weakestCategory: AtsCategoryKey | null
  maxRetries: number
}) {
  return sendEmailWithRetry(
    ({ to }) => sendAnonymousScan48hEmail({ to, weakestCategory: input.weakestCategory }),
    { to: input.to, firstName: null, maxRetries: input.maxRetries }
  )
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    if (!isAuthorizedCronRequest(request)) {
      logger.warn('Anonymous scan 48h cron request rejected: missing or invalid CRON_SECRET', {
        requestId,
        route: '/api/cron/anonymous-scan-48h',
        cronSecretConfigured: Boolean(process.env.CRON_SECRET),
      })
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const options = parseCronOptions(request)
    const supabase = createServerClient()

    const now = Date.now()
    const minCreatedAt = new Date(now - MAX_AGE_MS).toISOString()
    const maxCreatedAt = new Date(now - MIN_AGE_MS).toISOString()

    const { data, error } = await supabase
      .from('anonymous_scans')
      .select('id, email, weakest_category')
      .not('email', 'is', null)
      .gte('created_at', minCreatedAt)
      .lte('created_at', maxCreatedAt)
      .limit(options.limit)

    if (error) {
      logger.error('Failed to load anonymous-scan 48h candidates', {
        requestId,
        route: '/api/cron/anonymous-scan-48h',
        error: error.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const candidates = (data || []) as CandidateScan[]
    const candidateEmails = [...new Set(candidates.map((row) => row.email).filter(Boolean))] as string[]

    // Dedup requirement: a scan whose email now belongs to a real account
    // must not get this email, checked here at send time, not only when the
    // row was first inserted, since the account may have been created since.
    const accountedEmails = new Set<string>()
    if (candidateEmails.length > 0) {
      const { data: existingUsers, error: usersError } = await supabase
        .from('users')
        .select('email')
        .in('email', candidateEmails)

      if (usersError) {
        logger.error('Failed to check existing accounts for anonymous-scan 48h cron', {
          requestId,
          route: '/api/cron/anonymous-scan-48h',
          error: usersError.message,
        })
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
      }

      for (const row of existingUsers || []) {
        if (row?.email) accountedEmails.add(row.email)
      }
    }

    const eligible = candidates.filter(
      (row) => row.email && !accountedEmails.has(row.email) && !isDisposableEmailDomain(row.email)
    )

    if (options.dryRun) {
      return jsonWithRequestId(
        {
          dryRun: true,
          scanned: candidates.length,
          eligible: eligible.length,
          candidates: eligible.map((row) => ({ scan_id: row.id, email: row.email })),
        },
        200,
        requestId
      )
    }

    let sent = 0
    let retried = 0
    let deduped = 0
    const failures: Array<{ scan_id: string; reason: string }> = []

    for (const row of eligible) {
      const sourceEventId = buildSourceEventId(row.id)

      const { error: lockError } = await supabase.from('email_events').insert({
        user_clerk_id: `anon:${row.id}`,
        email: row.email,
        email_type: EMAIL_TYPE,
        status: 'processing',
        source_event_id: sourceEventId,
        metadata: { source: EVENT_SOURCE, stage: 'claimed', scanId: row.id },
      })

      if (lockError) {
        if (isDuplicateKeyError(lockError)) {
          deduped += 1
          continue
        }
        failures.push({ scan_id: row.id, reason: lockError.message })
        logger.error('Failed to claim anonymous-scan 48h email event lock', {
          requestId,
          route: '/api/cron/anonymous-scan-48h',
          scanId: row.id,
          error: lockError.message,
        })
        continue
      }

      const result = await sendWithRetry({
        to: row.email as string,
        weakestCategory: toCategoryKey(row.weakest_category),
        maxRetries: options.maxRetries,
      })

      if (result.attempts > 1) retried += 1

      if (!result.success) {
        const reason = result.error || 'Send failed'
        failures.push({ scan_id: row.id, reason })
        logger.error('Anonymous-scan 48h email send failed', {
          requestId,
          route: '/api/cron/anonymous-scan-48h',
          scanId: row.id,
          error: reason,
          attempts: result.attempts,
        })

        await supabase
          .from('email_events')
          .update({
            status: 'failed',
            error: reason,
            source_event_id: null,
            metadata: { source: EVENT_SOURCE, attempts: result.attempts, scanId: row.id },
          })
          .eq('source_event_id', sourceEventId)

        continue
      }

      await supabase
        .from('email_events')
        .update({
          status: 'sent',
          provider_id: result.providerId || null,
          error: null,
          metadata: { source: EVENT_SOURCE, attempts: result.attempts, scanId: row.id },
        })
        .eq('source_event_id', sourceEventId)

      sent += 1
    }

    logger.info('Anonymous-scan 48h cron execution finished', {
      requestId,
      route: '/api/cron/anonymous-scan-48h',
      scanned: candidates.length,
      eligible: eligible.length,
      sent,
      retried,
      deduped,
      failed: failures.length,
    })

    return jsonWithRequestId(
      {
        scanned: candidates.length,
        eligible: eligible.length,
        sent,
        retried,
        deduped,
        failed: failures.length,
        dryRun: false,
        failures,
      },
      200,
      requestId
    )
  } catch (error) {
    logger.error('Anonymous-scan 48h cron top-level failure', {
      requestId,
      route: '/api/cron/anonymous-scan-48h',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}

export const GET = POST
