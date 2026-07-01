import { createServerClient } from '@/lib/supabase/server'
import { sendReengagementEmail } from '@/lib/resend'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { capturePostHogEvent } from '@/lib/posthog-server'

export const runtime = 'nodejs'

type CandidateUser = {
  clerk_id: string
  email: string | null
  first_name: string | null
}

type CronOptions = {
  dryRun: boolean
  limit: number
  maxRetries: number
}

const REENGAGEMENT_EVENT_SOURCE = 'cron.reengagement-30d'
const REENGAGEMENT_EMAIL_TYPE = 'reengagement'
const MIN_ACCOUNT_AGE_MS = 30 * 24 * 60 * 60 * 1000
const MIN_INACTIVITY_MS = 14 * 24 * 60 * 60 * 1000

function parseOptions(request: Request): CronOptions {
  const url = new URL(request.url)
  const dryRunParam = url.searchParams.get('dryRun')
  const limitParam = Number(url.searchParams.get('limit') || '100')
  const retriesParam = Number(url.searchParams.get('retries') || '1')

  return {
    dryRun: dryRunParam === '1' || dryRunParam === 'true',
    limit: Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 100,
    maxRetries: Number.isFinite(retriesParam) ? Math.min(Math.max(retriesParam, 0), 3) : 1,
  }
}

function isDuplicateError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

function buildSourceEventId(userClerkId: string): string {
  return `${REENGAGEMENT_EVENT_SOURCE}:${userClerkId}`
}

async function sendWithRetry(input: { to: string; firstName: string | null; maxRetries: number }) {
  let lastError = ''

  for (let attempt = 0; attempt <= input.maxRetries; attempt += 1) {
    const result = await sendReengagementEmail({
      to: input.to,
      firstName: input.firstName,
    })

    if (result.success) {
      return {
        success: true,
        attempts: attempt + 1,
        providerId: result.providerId,
      }
    }

    lastError = result.error || 'Send failed'
  }

  return {
    success: false,
    attempts: input.maxRetries + 1,
    error: lastError,
  }
}

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const authHeader = request.headers.get('authorization') || ''
  const tokenFromBearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const tokenFromHeader = request.headers.get('x-cron-secret') || ''

  return tokenFromBearer === cronSecret || tokenFromHeader === cronSecret
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    if (!isAuthorized(request)) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const options = parseOptions(request)
    const supabase = createServerClient()

    const now = Date.now()
    const ageCutoff = new Date(now - MIN_ACCOUNT_AGE_MS).toISOString()
    const activityCutoff = new Date(now - MIN_INACTIVITY_MS).toISOString()

    const { data, error } = await supabase
      .from('users')
      .select('clerk_id, email, first_name')
      .lte('created_at', ageCutoff)
      .limit(options.limit)

    if (error) {
      logger.error('Failed to load reengagement candidates', {
        requestId,
        route: '/api/cron/reengagement-30d',
        error: error.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const candidates = (data || []) as CandidateUser[]
    const candidateIds = candidates.map((user) => user.clerk_id).filter(Boolean)

    const recentActivityIds = new Set<string>()
    const emailedIds = new Set<string>()

    if (candidateIds.length > 0) {
      const { data: recentEvents, error: eventsError } = await supabase
        .from('product_events')
        .select('user_clerk_id')
        .in('user_clerk_id', candidateIds)
        .gte('created_at', activityCutoff)

      if (eventsError) {
        logger.error('Failed to load product events for reengagement check', {
          requestId,
          route: '/api/cron/reengagement-30d',
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
        logger.error('Failed to load resumes for reengagement check', {
          requestId,
          route: '/api/cron/reengagement-30d',
          error: resumesError.message,
        })
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
      }

      for (const row of recentResumes || []) {
        if (row?.user_id) recentActivityIds.add(row.user_id)
      }

      const { data: priorEmails, error: emailError } = await supabase
        .from('email_events')
        .select('user_clerk_id')
        .eq('email_type', REENGAGEMENT_EMAIL_TYPE)
        .in('user_clerk_id', candidateIds)

      if (emailError) {
        logger.error('Failed to load reengagement email events', {
          requestId,
          route: '/api/cron/reengagement-30d',
          error: emailError.message,
        })
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
      }

      for (const row of priorEmails || []) {
        if (row?.user_clerk_id) emailedIds.add(row.user_clerk_id)
      }
    }

    const eligibleCandidates = candidates.filter(
      (user) => !recentActivityIds.has(user.clerk_id) && !emailedIds.has(user.clerk_id)
    )

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
        email_type: REENGAGEMENT_EMAIL_TYPE,
        status: 'processing',
        source_event_id: sourceEventId,
        metadata: { source: REENGAGEMENT_EVENT_SOURCE, stage: 'claimed' },
      })

      if (lockError) {
        if (isDuplicateError(lockError)) {
          deduped += 1
          logger.info('Reengagement send skipped due to duplicate lock', {
            requestId,
            route: '/api/cron/reengagement-30d',
            userId: user.clerk_id,
          })
          continue
        }

        failures.push({ clerk_id: user.clerk_id, reason: lockError.message })
        logger.error('Failed to claim reengagement email event lock', {
          requestId,
          route: '/api/cron/reengagement-30d',
          userId: user.clerk_id,
          error: lockError.message,
        })
        continue
      }

      if (!user.email) {
        skipped += 1
        failures.push({ clerk_id: user.clerk_id, reason: 'Missing email' })
        logger.warn('Reengagement skipped because user email is missing', {
          requestId,
          route: '/api/cron/reengagement-30d',
          userId: user.clerk_id,
        })

        await supabase
          .from('email_events')
          .update({
            email: null,
            status: 'skipped',
            error: 'Missing email',
            metadata: { source: REENGAGEMENT_EVENT_SOURCE, reason: 'missing-email' },
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
        logger.error('Reengagement email send failed', {
          requestId,
          route: '/api/cron/reengagement-30d',
          userId: user.clerk_id,
          error: reason,
          attempts: result.attempts,
        })

        await supabase
          .from('email_events')
          .update({
            status: 'failed',
            error: reason,
            metadata: { source: REENGAGEMENT_EVENT_SOURCE, attempts: result.attempts },
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
          metadata: { source: REENGAGEMENT_EVENT_SOURCE, attempts: result.attempts },
        })
        .eq('source_event_id', sourceEventId)

      await capturePostHogEvent({
        distinctId: user.clerk_id,
        event: 'reengagement_email_sent',
        properties: {},
      })

      sent += 1
    }

    logger.info('Reengagement cron execution finished', {
      requestId,
      route: '/api/cron/reengagement-30d',
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
    logger.error('Reengagement cron top-level failure', {
      requestId,
      route: '/api/cron/reengagement-30d',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
