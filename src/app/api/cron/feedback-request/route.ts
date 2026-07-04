import { createServerClient } from '@/lib/supabase/server'
import { sendFeedbackRequestEmail } from '@/lib/resend'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'

export const runtime = 'nodejs'

type ProductEventRow = {
  id: string
  user_clerk_id: string
  event_name: string
  created_at: string
}

type CronOptions = {
  dryRun: boolean
  limit: number
}

const FEEDBACK_EVENT_SOURCE = 'cron.feedback-request'

const FEEDBACK_EMAIL_TYPES = {
  resume_created: 'feedback_resume_created',
  document_downloaded: 'feedback_document_downloaded',
} as const

type FeedbackTrigger = keyof typeof FEEDBACK_EMAIL_TYPES

const CREATED_DELAY_MS = 10 * 60 * 1000
const DOWNLOAD_DELAY_MS = 60 * 60 * 1000
const LOOKBACK_MS = 24 * 60 * 60 * 1000
const DAILY_CAP_WINDOW_MS = 24 * 60 * 60 * 1000

function parseOptions(request: Request): CronOptions {
  const url = new URL(request.url)
  const dryRunParam = url.searchParams.get('dryRun')
  const limitParam = Number(url.searchParams.get('limit') || '200')

  return {
    dryRun: dryRunParam === '1' || dryRunParam === 'true',
    limit: Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200,
  }
}

function isDuplicateError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

function buildSourceEventId(productEventId: string): string {
  return `${FEEDBACK_EVENT_SOURCE}:${productEventId}`
}

function triggerForEventName(eventName: string): FeedbackTrigger {
  return eventName === 'resume_created' ? 'resume_created' : 'document_downloaded'
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

    const createdWindowEnd = new Date(now - CREATED_DELAY_MS).toISOString()
    const createdWindowStart = new Date(now - CREATED_DELAY_MS - LOOKBACK_MS).toISOString()
    const downloadWindowEnd = new Date(now - DOWNLOAD_DELAY_MS).toISOString()
    const downloadWindowStart = new Date(now - DOWNLOAD_DELAY_MS - LOOKBACK_MS).toISOString()

    const { data: createdEvents, error: createdError } = await supabase
      .from('product_events')
      .select('id, user_clerk_id, event_name, created_at')
      .eq('event_name', 'resume_created')
      .gte('created_at', createdWindowStart)
      .lte('created_at', createdWindowEnd)
      .limit(options.limit)

    if (createdError) {
      logger.error('Failed to load resume_created candidates', {
        requestId,
        route: '/api/cron/feedback-request',
        error: createdError.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const { data: downloadEvents, error: downloadError } = await supabase
      .from('product_events')
      .select('id, user_clerk_id, event_name, created_at')
      .in('event_name', ['resume_exported_pdf', 'cover_letter_exported_pdf'])
      .gte('created_at', downloadWindowStart)
      .lte('created_at', downloadWindowEnd)
      .limit(options.limit)

    if (downloadError) {
      logger.error('Failed to load document download candidates', {
        requestId,
        route: '/api/cron/feedback-request',
        error: downloadError.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const candidates = [
      ...((createdEvents || []) as ProductEventRow[]),
      ...((downloadEvents || []) as ProductEventRow[]),
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    if (options.dryRun) {
      return jsonWithRequestId(
        {
          dryRun: true,
          scanned: candidates.length,
          candidates: candidates.map((event) => ({
            id: event.id,
            user_clerk_id: event.user_clerk_id,
            event_name: event.event_name,
          })),
        },
        200,
        requestId
      )
    }

    let sent = 0
    let deduped = 0
    let capped = 0
    let skipped = 0
    const failures: Array<{ id: string; reason: string }> = []

    for (const event of candidates) {
      const trigger = triggerForEventName(event.event_name)
      const emailType = FEEDBACK_EMAIL_TYPES[trigger]
      const sourceEventId = buildSourceEventId(event.id)

      const { error: lockError } = await supabase.from('email_events').insert({
        user_clerk_id: event.user_clerk_id,
        email: null,
        email_type: emailType,
        status: 'processing',
        source_event_id: sourceEventId,
        metadata: { source: FEEDBACK_EVENT_SOURCE, productEventId: event.id, stage: 'claimed' },
      })

      if (lockError) {
        if (isDuplicateError(lockError)) {
          deduped += 1
          continue
        }

        failures.push({ id: event.id, reason: lockError.message })
        logger.error('Failed to claim feedback email event lock', {
          requestId,
          route: '/api/cron/feedback-request',
          productEventId: event.id,
          error: lockError.message,
        })
        continue
      }

      const dailyCapCutoff = new Date(now - DAILY_CAP_WINDOW_MS).toISOString()
      const { data: recentFeedbackEmails, error: capError } = await supabase
        .from('email_events')
        .select('id')
        .eq('user_clerk_id', event.user_clerk_id)
        .in('email_type', Object.values(FEEDBACK_EMAIL_TYPES))
        .eq('status', 'sent')
        .gte('created_at', dailyCapCutoff)
        .limit(1)

      if (capError) {
        failures.push({ id: event.id, reason: capError.message })
        logger.error('Failed to check feedback email daily cap', {
          requestId,
          route: '/api/cron/feedback-request',
          productEventId: event.id,
          error: capError.message,
        })

        await supabase
          .from('email_events')
          .update({ status: 'failed', error: capError.message })
          .eq('source_event_id', sourceEventId)

        continue
      }

      if (recentFeedbackEmails && recentFeedbackEmails.length > 0) {
        capped += 1
        await supabase
          .from('email_events')
          .update({
            status: 'skipped',
            error: 'Daily feedback email cap reached',
            metadata: { source: FEEDBACK_EVENT_SOURCE, productEventId: event.id, reason: 'daily-cap' },
          })
          .eq('source_event_id', sourceEventId)
        continue
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, first_name')
        .eq('clerk_id', event.user_clerk_id)
        .maybeSingle()

      if (userError || !user?.email) {
        skipped += 1
        const reason = userError?.message || 'Missing email'
        failures.push({ id: event.id, reason })
        await supabase
          .from('email_events')
          .update({
            status: 'skipped',
            error: reason,
            metadata: { source: FEEDBACK_EVENT_SOURCE, productEventId: event.id, reason: 'missing-email' },
          })
          .eq('source_event_id', sourceEventId)
        continue
      }

      const result = await sendFeedbackRequestEmail({
        to: user.email,
        firstName: user.first_name,
        trigger,
      })

      if (!result.success) {
        const reason = result.error || 'Send failed'
        failures.push({ id: event.id, reason })
        logger.error('Feedback email send failed', {
          requestId,
          route: '/api/cron/feedback-request',
          productEventId: event.id,
          error: reason,
        })

        await supabase
          .from('email_events')
          .update({ status: 'failed', error: reason, email: user.email })
          .eq('source_event_id', sourceEventId)

        continue
      }

      await supabase
        .from('email_events')
        .update({
          status: 'sent',
          email: user.email,
          provider_id: result.providerId || null,
          error: null,
          metadata: { source: FEEDBACK_EVENT_SOURCE, productEventId: event.id },
        })
        .eq('source_event_id', sourceEventId)

      sent += 1
    }

    logger.info('Feedback request cron execution finished', {
      requestId,
      route: '/api/cron/feedback-request',
      scanned: candidates.length,
      sent,
      deduped,
      capped,
      skipped,
      failed: failures.length,
    })

    return jsonWithRequestId(
      {
        scanned: candidates.length,
        sent,
        deduped,
        capped,
        skipped,
        failed: failures.length,
        dryRun: false,
        failures,
      },
      200,
      requestId
    )
  } catch (error) {
    logger.error('Feedback request cron top-level failure', {
      requestId,
      route: '/api/cron/feedback-request',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
