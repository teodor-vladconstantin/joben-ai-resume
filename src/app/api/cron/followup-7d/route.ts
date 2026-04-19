import { createServerClient } from '@/lib/supabase/server'
import { sendSevenDayFollowupEmail } from '@/lib/resend'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'

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

const FOLLOWUP_EVENT_SOURCE = 'cron.followup-7d'

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
  return `${FOLLOWUP_EVENT_SOURCE}:${userClerkId}`
}

async function sendWithRetry(input: {
  to: string
  firstName: string | null
  maxRetries: number
}) {
  let lastError = ''

  for (let attempt = 0; attempt <= input.maxRetries; attempt += 1) {
    const result = await sendSevenDayFollowupEmail({
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
  if (!isAuthorized(request)) {
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const options = parseOptions(request)

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
    return jsonWithRequestId({ error: error.message }, 500, requestId)
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
      if (isDuplicateError(lockError)) {
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
}
