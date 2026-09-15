import { createServerClient } from '@/lib/supabase/server'
import { sendExportFollowupEmail } from '@/lib/resend'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import {
  isAuthorizedCronRequest,
  isDuplicateKeyError,
  parseCronOptions,
  sendEmailWithRetry,
} from '@/lib/cron-utils'

export const runtime = 'nodejs'

const EVENT_SOURCE = 'cron.export-followup-14d'
const EMAIL_TYPE = 'export_followup_14d'

// Real-life-event trigger, not a calendar nag: a PDF export is a proxy for
// "submitted an application," so the window (10-21 days) targets the point
// where a user would realistically know whether they heard back, not a fixed
// day-count since signup. One-shot per user (source_event_id has no time
// bucket, unlike the rate-limit email), since the point is a single relevant
// nudge, not a recurring reminder.
const MIN_AGE_MS = 10 * 24 * 60 * 60 * 1000
const MAX_AGE_MS = 21 * 24 * 60 * 60 * 1000
// A user who has done anything in the product since their export already
// knows Joben is there; sending this on top would read as noise.
const RECENT_ACTIVITY_MS = 9 * 24 * 60 * 60 * 1000

type ExportEvent = {
  user_clerk_id: string
  created_at: string
}

function buildSourceEventId(userClerkId: string): string {
  return `${EVENT_SOURCE}:${userClerkId}`
}

async function sendWithRetry(input: { to: string; firstName: string | null; maxRetries: number }) {
  return sendEmailWithRetry(sendExportFollowupEmail, input)
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    if (!isAuthorizedCronRequest(request)) {
      logger.warn('Export-followup cron request rejected: missing or invalid CRON_SECRET', {
        requestId,
        route: '/api/cron/export-followup-14d',
        cronSecretConfigured: Boolean(process.env.CRON_SECRET),
      })
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const options = parseCronOptions(request)
    const supabase = createServerClient()

    const now = Date.now()
    const minCreatedAt = new Date(now - MAX_AGE_MS).toISOString()
    const maxCreatedAt = new Date(now - MIN_AGE_MS).toISOString()
    const recentActivityCutoff = new Date(now - RECENT_ACTIVITY_MS).toISOString()

    const { data: exportRows, error: exportError } = await supabase
      .from('product_events')
      .select('user_clerk_id, created_at')
      .eq('event_name', 'resume_exported_pdf')
      .gte('created_at', minCreatedAt)
      .lte('created_at', maxCreatedAt)
      .limit(options.limit)

    if (exportError) {
      logger.error('Failed to load export-followup candidates', {
        requestId,
        route: '/api/cron/export-followup-14d',
        error: exportError.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    // One candidate per user (earliest qualifying export is enough to decide eligibility).
    const exportByUser = new Map<string, ExportEvent>()
    for (const row of (exportRows || []) as ExportEvent[]) {
      if (!row.user_clerk_id) continue
      if (!exportByUser.has(row.user_clerk_id)) exportByUser.set(row.user_clerk_id, row)
    }
    const candidateIds = [...exportByUser.keys()]

    const recentActivityIds = new Set<string>()
    if (candidateIds.length > 0) {
      const { data: recentEvents, error: recentError } = await supabase
        .from('product_events')
        .select('user_clerk_id')
        .in('user_clerk_id', candidateIds)
        .gte('created_at', recentActivityCutoff)

      if (recentError) {
        logger.error('Failed to load recent activity for export-followup check', {
          requestId,
          route: '/api/cron/export-followup-14d',
          error: recentError.message,
        })
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
      }

      for (const row of recentEvents || []) {
        if (row?.user_clerk_id) recentActivityIds.add(row.user_clerk_id)
      }
    }

    const eligibleIds = candidateIds.filter((id) => !recentActivityIds.has(id))

    const usersById = new Map<string, { email: string | null; first_name: string | null }>()
    if (eligibleIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('clerk_id, email, first_name')
        .in('clerk_id', eligibleIds)

      if (usersError) {
        logger.error('Failed to load users for export-followup cron', {
          requestId,
          route: '/api/cron/export-followup-14d',
          error: usersError.message,
        })
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
      }

      for (const user of users || []) {
        if (user?.clerk_id) usersById.set(user.clerk_id, { email: user.email, first_name: user.first_name })
      }
    }

    if (options.dryRun) {
      return jsonWithRequestId(
        {
          dryRun: true,
          scanned: candidateIds.length,
          eligible: eligibleIds.length,
          candidates: eligibleIds.map((id) => ({ clerk_id: id, email: usersById.get(id)?.email || null })),
        },
        200,
        requestId
      )
    }

    let sent = 0
    let retried = 0
    let deduped = 0
    let skipped = 0
    const failures: Array<{ clerk_id: string; reason: string }> = []

    for (const userId of eligibleIds) {
      const user = usersById.get(userId)
      const sourceEventId = buildSourceEventId(userId)

      const { error: lockError } = await supabase.from('email_events').insert({
        user_clerk_id: userId,
        email: user?.email || null,
        email_type: EMAIL_TYPE,
        status: 'processing',
        source_event_id: sourceEventId,
        metadata: { source: EVENT_SOURCE, stage: 'claimed' },
      })

      if (lockError) {
        if (isDuplicateKeyError(lockError)) {
          deduped += 1
          continue
        }
        failures.push({ clerk_id: userId, reason: lockError.message })
        logger.error('Failed to claim export-followup email event lock', {
          requestId,
          route: '/api/cron/export-followup-14d',
          userId,
          error: lockError.message,
        })
        continue
      }

      if (!user?.email) {
        skipped += 1
        failures.push({ clerk_id: userId, reason: 'Missing email' })
        await supabase
          .from('email_events')
          .update({
            email: null,
            status: 'skipped',
            error: 'Missing email',
            source_event_id: null,
            metadata: { source: EVENT_SOURCE, reason: 'missing-email' },
          })
          .eq('source_event_id', sourceEventId)
        continue
      }

      const result = await sendWithRetry({
        to: user.email,
        firstName: user.first_name || null,
        maxRetries: options.maxRetries,
      })

      if (result.attempts > 1) retried += 1

      if (!result.success) {
        const reason = result.error || 'Send failed'
        failures.push({ clerk_id: userId, reason })
        logger.error('Export-followup email send failed', {
          requestId,
          route: '/api/cron/export-followup-14d',
          userId,
          error: reason,
          attempts: result.attempts,
        })

        await supabase
          .from('email_events')
          .update({
            status: 'failed',
            error: reason,
            source_event_id: null,
            metadata: { source: EVENT_SOURCE, attempts: result.attempts },
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
          metadata: { source: EVENT_SOURCE, attempts: result.attempts },
        })
        .eq('source_event_id', sourceEventId)

      sent += 1
    }

    logger.info('Export-followup cron execution finished', {
      requestId,
      route: '/api/cron/export-followup-14d',
      scanned: candidateIds.length,
      eligible: eligibleIds.length,
      sent,
      retried,
      deduped,
      skipped,
      failed: failures.length,
    })

    return jsonWithRequestId(
      {
        scanned: candidateIds.length,
        eligible: eligibleIds.length,
        sent,
        retried,
        deduped,
        skipped,
        failed: failures.length,
        dryRun: false,
        failures,
      },
      200,
      requestId
    )
  } catch (error) {
    logger.error('Export-followup cron top-level failure', {
      requestId,
      route: '/api/cron/export-followup-14d',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}

export const GET = POST
