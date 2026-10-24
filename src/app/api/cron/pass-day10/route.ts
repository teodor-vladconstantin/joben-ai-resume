import { createServerClient } from '@/lib/supabase/server'
import { sendPassDay10Email, toAnonScanEmailLocale } from '@/lib/resend'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import {
  isAuthorizedCronRequest,
  isDuplicateKeyError,
  parseCronOptions,
  sendEmailWithRetry,
} from '@/lib/cron-utils'

export const runtime = 'nodejs'

const EMAIL_TYPE = 'pass_day10'
const DAY_MS = 24 * 60 * 60 * 1000
// Sent from day 10 of the 14-day pass. The 3 extra days let a skipped run catch
// up; the email_events lock keeps each purchase to one email.
const MIN_AGE_MS = 10 * DAY_MS
const MAX_AGE_MS = 13 * DAY_MS

type PassPurchase = {
  event_id: string
  payload: { data?: { object?: { metadata?: { userId?: string; locale?: string } } } }
}

// Candidates are pass checkouts in webhook_events (a referral grant also sets
// pro_expires_at, so that column alone cannot tell the two apart).
export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    if (!isAuthorizedCronRequest(request)) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const options = parseCronOptions(request)
    const supabase = createServerClient()
    const now = Date.now()

    const { data: purchases, error } = await supabase
      .from('webhook_events')
      .select('event_id, payload')
      .eq('provider', 'stripe')
      .eq('event_type', 'checkout.session.completed')
      .eq('payload->data->object->metadata->>planId', 'pass_14d')
      .gte('created_at', new Date(now - MAX_AGE_MS).toISOString())
      .lte('created_at', new Date(now - MIN_AGE_MS).toISOString())
      .limit(options.limit)

    if (error) {
      logger.error('Failed to load pass-day10 candidates', { requestId, route: '/api/cron/pass-day10', error: error.message })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const rows = (purchases || []) as PassPurchase[]
    const clerkIds = [...new Set(rows.map((r) => r.payload.data?.object?.metadata?.userId).filter(Boolean))] as string[]

    const { data: users, error: usersError } = clerkIds.length
      ? await supabase
          .from('users')
          .select('clerk_id, email, pro_expires_at, stripe_subscription_id, lifetime_recruiting_unlocked')
          .in('clerk_id', clerkIds)
      : { data: [], error: null }

    if (usersError) {
      logger.error('Failed to load pass-day10 users', { requestId, route: '/api/cron/pass-day10', error: usersError.message })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const userById = new Map((users || []).map((u) => [u.clerk_id as string, u]))
    let sent = 0
    let skipped = 0
    let failed = 0

    for (const row of rows) {
      const meta = row.payload.data?.object?.metadata
      const user = meta?.userId ? userById.get(meta.userId) : undefined
      const expiresMs = user?.pro_expires_at ? new Date(user.pro_expires_at).getTime() : 0
      // Already on a subscription, lifetime, or the pass ended: nothing to offer.
      if (!user?.email || user.stripe_subscription_id || user.lifetime_recruiting_unlocked || expiresMs <= now) {
        skipped += 1
        continue
      }
      if (options.dryRun) {
        sent += 1
        continue
      }

      const sourceEventId = `${EMAIL_TYPE}:${row.event_id}`
      const { error: lockError } = await supabase.from('email_events').insert({
        user_clerk_id: meta!.userId,
        email: user.email,
        email_type: EMAIL_TYPE,
        status: 'processing',
        source_event_id: sourceEventId,
        metadata: { source: 'cron.pass-day10' },
      })
      if (lockError) {
        if (isDuplicateKeyError(lockError)) skipped += 1
        else failed += 1
        continue
      }

      const daysLeft = Math.max(1, Math.ceil((expiresMs - now) / DAY_MS))
      const result = await sendEmailWithRetry(
        ({ to }) => sendPassDay10Email({ to, locale: toAnonScanEmailLocale(meta?.locale), daysLeft }),
        { to: user.email, firstName: null, maxRetries: options.maxRetries }
      )

      if (!result.success) {
        failed += 1
        // Releasing the lock lets the next daily run retry within the window.
        await supabase
          .from('email_events')
          .update({ status: 'failed', error: result.error || 'Send failed', source_event_id: null })
          .eq('source_event_id', sourceEventId)
        continue
      }

      await supabase
        .from('email_events')
        .update({ status: result.suppressed ? 'suppressed' : 'sent', provider_id: result.providerId || null })
        .eq('source_event_id', sourceEventId)
      if (!result.suppressed) sent += 1
    }

    logger.info('Pass day-10 cron finished', { requestId, route: '/api/cron/pass-day10', candidates: rows.length, sent, skipped, failed })
    return jsonWithRequestId({ candidates: rows.length, sent, skipped, failed, dryRun: options.dryRun }, 200, requestId)
  } catch (error) {
    logger.error('Pass day-10 cron top-level failure', {
      requestId,
      route: '/api/cron/pass-day10',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
