import { createServerClient } from '@/lib/supabase/server'
import { sendSevenDayFollowupEmail } from '@/lib/resend'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import {
  type CronCandidateUser,
  isAuthorizedCronRequest,
  isDuplicateKeyError,
  parseCronOptions,
  sendEmailWithRetry,
} from '@/lib/cron-utils'

export const runtime = 'nodejs'

type CandidateUser = CronCandidateUser

const FOLLOWUP_EVENT_SOURCE = 'cron.followup-7d'

function buildSourceEventId(userClerkId: string): string {
  return `${FOLLOWUP_EVENT_SOURCE}:${userClerkId}`
}

async function sendWithRetry(input: {
  to: string
  firstName: string | null
  maxRetries: number
}) {
  return sendEmailWithRetry(sendSevenDayFollowupEmail, input)
}

// Vercel Cron Jobs always invoke the configured path with GET, never POST —
// this route (and inactivity-3d) only exported POST for months, so every
// scheduled invocation hit Next.js's default 405 before any route code ran,
// including the auth check. GET is aliased to the same handler so Vercel's
// scheduler works; POST stays for manual/ops-script triggers (see RUNBOOK.md).
export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    if (!isAuthorizedCronRequest(request)) {
      // See inactivity-3d for why this is logged: a missing/misconfigured
      // CRON_SECRET in the deployment env silently 401s every invocation
      // forever, with no trace anywhere else.
      logger.warn('Followup cron request rejected: missing or invalid CRON_SECRET', {
        requestId,
        route: '/api/cron/followup-7d',
        cronSecretConfigured: Boolean(process.env.CRON_SECRET),
      })
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const options = parseCronOptions(request)

    const supabase = createServerClient()
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('users')
      .select('clerk_id, email, first_name')
      .is('followup_sent_at', null)
      .lte('created_at', cutoffDate)
      .limit(options.limit)

    if (error) {
      logger.error('Failed to load followup candidates', {
        requestId,
        route: '/api/cron/followup-7d',
        error: error.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const candidates = (data || []) as CandidateUser[]

    if (options.dryRun) {
      return jsonWithRequestId(
        {
          dryRun: true,
          scanned: candidates.length,
          candidates: candidates.map((user) => ({ clerk_id: user.clerk_id, email: user.email })),
        },
        200,
        requestId
      )
    }

    let sent = 0
    let retried = 0
    let deduped = 0
    const failures: Array<{ clerk_id: string; reason: string }> = []

    for (const user of candidates) {
      const sourceEventId = buildSourceEventId(user.clerk_id)

      const { error: lockError } = await supabase.from('email_events').insert({
        user_clerk_id: user.clerk_id,
        email: user.email,
        email_type: 'followup_7d',
        status: 'processing',
        source_event_id: sourceEventId,
        metadata: { source: FOLLOWUP_EVENT_SOURCE, stage: 'claimed' },
      })

      if (lockError) {
        if (isDuplicateKeyError(lockError)) {
          deduped += 1
          logger.info('Followup send skipped due to duplicate lock', {
            requestId,
            route: '/api/cron/followup-7d',
            userId: user.clerk_id,
          })
          continue
        }

        failures.push({ clerk_id: user.clerk_id, reason: lockError.message })
        logger.error('Failed to claim followup email event lock', {
          requestId,
          route: '/api/cron/followup-7d',
          userId: user.clerk_id,
          error: lockError.message,
        })
        continue
      }

      if (!user.email) {
        failures.push({ clerk_id: user.clerk_id, reason: 'Missing email' })
        logger.warn('Followup skipped because user email is missing', {
          requestId,
          route: '/api/cron/followup-7d',
          userId: user.clerk_id,
        })

        await supabase
          .from('email_events')
          .update({
            email: null,
            status: 'skipped',
            error: 'Missing email',
            source_event_id: null,
            metadata: { source: FOLLOWUP_EVENT_SOURCE, reason: 'missing-email' },
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
        failures.push({ clerk_id: user.clerk_id, reason })
        logger.error('Followup email send failed', {
          requestId,
          route: '/api/cron/followup-7d',
          userId: user.clerk_id,
          error: reason,
          attempts: result.attempts,
        })

        await supabase
          .from('email_events')
          .update({
            status: 'failed',
            error: reason,
            source_event_id: null,
            metadata: { source: FOLLOWUP_EVENT_SOURCE, attempts: result.attempts },
          })
          .eq('source_event_id', sourceEventId)

        continue
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ followup_sent_at: new Date().toISOString() })
        .eq('clerk_id', user.clerk_id)

      if (updateError) {
        failures.push({ clerk_id: user.clerk_id, reason: updateError.message })
        logger.error('Failed to update user followup_sent_at', {
          requestId,
          route: '/api/cron/followup-7d',
          userId: user.clerk_id,
          error: updateError.message,
        })

        await supabase
          .from('email_events')
          .update({
            status: 'failed',
            error: updateError.message,
            source_event_id: null,
            metadata: { source: FOLLOWUP_EVENT_SOURCE, attempts: result.attempts },
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
          metadata: { source: FOLLOWUP_EVENT_SOURCE, attempts: result.attempts },
        })
        .eq('source_event_id', sourceEventId)

      sent += 1
    }

    logger.info('Followup cron execution finished', {
      requestId,
      route: '/api/cron/followup-7d',
      scanned: candidates.length,
      sent,
      retried,
      deduped,
      failed: failures.length,
    })

    return jsonWithRequestId(
      {
        scanned: candidates.length,
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
    logger.error('Followup cron top-level failure', {
      requestId,
      route: '/api/cron/followup-7d',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}

export const GET = POST
