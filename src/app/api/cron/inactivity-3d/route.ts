import { createServerClient } from '@/lib/supabase/server'
import { sendInactivityEmail } from '@/lib/resend'
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

const INACTIVITY_EVENT_SOURCE = 'cron.inactivity-3d'

function buildSourceEventId(userClerkId: string): string {
  return `${INACTIVITY_EVENT_SOURCE}:${userClerkId}`
}

async function sendWithRetry(input: { to: string; firstName: string | null; maxRetries: number }) {
  return sendEmailWithRetry(sendInactivityEmail, input)
}

// Vercel Cron Jobs always invoke the configured path with GET, never POST —
// this route (and followup-7d) only exported POST, so every scheduled
// invocation hit Next.js's default 405 before any route code ran, including
// the auth check below (confirmed in prod logs: GET .../inactivity-3d 405).
// GET is aliased to the same handler so Vercel's scheduler actually works;
// POST stays for manual/ops-script triggers (see RUNBOOK.md).
export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    if (!isAuthorizedCronRequest(request)) {
      // Kept as defense-in-depth / fast diagnosis: a misconfigured or
      // missing CRON_SECRET in the deployment env would otherwise 401 every
      // invocation silently, with no trace anywhere else.
      logger.warn('Inactivity cron request rejected: missing or invalid CRON_SECRET', {
        requestId,
        route: '/api/cron/inactivity-3d',
        cronSecretConfigured: Boolean(process.env.CRON_SECRET),
      })
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const options = parseCronOptions(request)
    const supabase = createServerClient()

    const now = Date.now()
    const recentCutoff = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    const activityCutoff = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('users')
      .select('clerk_id, email, first_name')
      .gte('created_at', recentCutoff)
      .is('inactivity_email_sent_at', null)
      .limit(options.limit)

    if (error) {
      logger.error('Failed to load inactivity candidates', {
        requestId,
        route: '/api/cron/inactivity-3d',
        error: error.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const candidates = (data || []) as CandidateUser[]
    const candidateIds = candidates.map((user) => user.clerk_id).filter(Boolean)

    // "Already emailed" exclusion lives on users.inactivity_email_sent_at
    // (set only on confirmed send success, below) — not on the presence of
    // an email_events row, which used to permanently exclude a user after
    // any failed/skipped/stuck-processing attempt regardless of outcome.
    const recentActivityIds = new Set<string>()

    if (candidateIds.length > 0) {
      const { data: recentEvents, error: eventsError } = await supabase
        .from('product_events')
        .select('user_clerk_id')
        .in('user_clerk_id', candidateIds)
        .gte('created_at', activityCutoff)

      if (eventsError) {
        logger.error('Failed to load product events for inactivity check', {
          requestId,
          route: '/api/cron/inactivity-3d',
          error: eventsError.message,
        })
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
      }

      for (const row of recentEvents || []) {
        if (row?.user_clerk_id) recentActivityIds.add(row.user_clerk_id)
      }

      const { data: recentResumes, error: resumesError } = await supabase
        .from('resumes')
        .select('user_id')
        .in('user_id', candidateIds)
        .gte('created_at', activityCutoff)

      if (resumesError) {
        logger.error('Failed to load resumes for inactivity check', {
          requestId,
          route: '/api/cron/inactivity-3d',
          error: resumesError.message,
        })
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
      }

      for (const row of recentResumes || []) {
        if (row?.user_id) recentActivityIds.add(row.user_id)
      }
    }

    const eligibleCandidates = candidates.filter((user) => !recentActivityIds.has(user.clerk_id))

    if (options.dryRun) {
      return jsonWithRequestId(
        {
          dryRun: true,
          scanned: candidates.length,
          eligible: eligibleCandidates.length,
          candidates: eligibleCandidates.map((user) => ({ clerk_id: user.clerk_id, email: user.email })),
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

    for (const user of eligibleCandidates) {
      const sourceEventId = buildSourceEventId(user.clerk_id)

      const { error: lockError } = await supabase.from('email_events').insert({
        user_clerk_id: user.clerk_id,
        email: user.email,
        email_type: 'inactivity_3d',
        status: 'processing',
        source_event_id: sourceEventId,
        metadata: { source: INACTIVITY_EVENT_SOURCE, stage: 'claimed' },
      })

      if (lockError) {
        if (isDuplicateKeyError(lockError)) {
          deduped += 1
          logger.info('Inactivity send skipped due to duplicate lock', {
            requestId,
            route: '/api/cron/inactivity-3d',
            userId: user.clerk_id,
          })
          continue
        }

        failures.push({ clerk_id: user.clerk_id, reason: lockError.message })
        logger.error('Failed to claim inactivity email event lock', {
          requestId,
          route: '/api/cron/inactivity-3d',
          userId: user.clerk_id,
          error: lockError.message,
        })
        continue
      }

      if (!user.email) {
        skipped += 1
        failures.push({ clerk_id: user.clerk_id, reason: 'Missing email' })
        logger.warn('Inactivity skipped because user email is missing', {
          requestId,
          route: '/api/cron/inactivity-3d',
          userId: user.clerk_id,
        })

        await supabase
          .from('email_events')
          .update({
            email: null,
            status: 'skipped',
            error: 'Missing email',
            // Release the unique (user, type, source_event_id) slot so a
            // future run can re-attempt once the user has an email — a
            // permanent source_event_id here is what caused this class of
            // bug (skipped/failed rows silently locking users out forever).
            source_event_id: null,
            metadata: { source: INACTIVITY_EVENT_SOURCE, reason: 'missing-email' },
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
        logger.error('Inactivity email send failed', {
          requestId,
          route: '/api/cron/inactivity-3d',
          userId: user.clerk_id,
          error: reason,
          attempts: result.attempts,
        })

        await supabase
          .from('email_events')
          .update({
            status: 'failed',
            error: reason,
            // Same as the missing-email path: null this out so a permanent
            // send failure (e.g. a transient Resend outage) doesn't lock the
            // user out of ever getting this email again.
            source_event_id: null,
            metadata: { source: INACTIVITY_EVENT_SOURCE, attempts: result.attempts },
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
          metadata: { source: INACTIVITY_EVENT_SOURCE, attempts: result.attempts },
        })
        .eq('source_event_id', sourceEventId)

      const { error: markSentError } = await supabase
        .from('users')
        .update({ inactivity_email_sent_at: new Date().toISOString() })
        .eq('clerk_id', user.clerk_id)

      if (markSentError) {
        logger.error('Failed to update user inactivity_email_sent_at', {
          requestId,
          route: '/api/cron/inactivity-3d',
          userId: user.clerk_id,
          error: markSentError.message,
        })
      }

      sent += 1
    }

    logger.info('Inactivity cron execution finished', {
      requestId,
      route: '/api/cron/inactivity-3d',
      scanned: candidates.length,
      eligible: eligibleCandidates.length,
      sent,
      retried,
      deduped,
      skipped,
      failed: failures.length,
    })

    return jsonWithRequestId(
      {
        scanned: candidates.length,
        eligible: eligibleCandidates.length,
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
    logger.error('Inactivity cron top-level failure', {
      requestId,
      route: '/api/cron/inactivity-3d',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}

export const GET = POST
