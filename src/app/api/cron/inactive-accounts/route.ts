import { clerkClient } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { isAuthorizedCronRequest, isDuplicateKeyError, parseCronOptions } from '@/lib/cron-utils'
import { sendTransactionalEmail } from '@/lib/resend'
import { deleteAccount } from '@/lib/account-deletion'
import { buildInactivityWarningEmail, inactivityStage } from '@/lib/account-inactivity'
import { APP_ORIGIN } from '@/lib/app-origin'

export const runtime = 'nodejs'

const EMAIL_TYPE = 'inactive_account_warning'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://joben.eu'

// Warns accounts idle for ~23 months and deletes them 30+ days later once idle
// for 24 months (Privacy Policy section 6). Accounts with a Stripe
// subscription are never deleted here: they are still paying customers.
export async function POST(request: Request) {
  const requestId = getRequestId(request)

  if (!isAuthorizedCronRequest(request)) {
    logger.warn('Inactive accounts cron request rejected', { requestId, route: '/api/cron/inactive-accounts' })
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const options = parseCronOptions(request)
  const supabase = createServerClient()
  const client = await clerkClient()
  const now = Date.now()

  // Oldest activity first, so a bounded page always reaches the stale accounts.
  const { data: users } = await client.users.getUserList({ orderBy: '+last_active_at', limit: Math.min(options.limit, 100) })

  const summary = { scanned: users.length, warned: 0, deleted: 0, waiting: 0, skipped: 0, failed: 0 }
  const plan: Array<{ userId: string; stage: string }> = []

  for (const user of users) {
    const lastActiveMs = user.lastActiveAt ?? user.lastSignInAt ?? user.createdAt
    const lastActiveDay = new Date(lastActiveMs).toISOString().slice(0, 10)
    // Keyed on the last-activity day so a user who came back and went idle
    // again later gets a fresh warning, not the old one.
    const sourceEventId = `inactive-warning:${user.id}:${lastActiveDay}`

    const { data: warning } = await supabase
      .from('email_events')
      .select('created_at')
      .eq('user_clerk_id', user.id)
      .eq('email_type', EMAIL_TYPE)
      .eq('source_event_id', sourceEventId)
      .eq('status', 'sent')
      .maybeSingle()

    const stage = inactivityStage({
      lastActiveMs,
      nowMs: now,
      warnedAtMs: warning?.created_at ? new Date(warning.created_at).getTime() : null,
    })
    if (stage === 'active') continue
    plan.push({ userId: user.id, stage })

    if (options.dryRun) continue
    if (stage === 'wait') {
      summary.waiting += 1
      continue
    }

    if (stage === 'warn') {
      const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
      if (!email) {
        summary.skipped += 1
        continue
      }
      const { error: lockError } = await supabase.from('email_events').insert({
        user_clerk_id: user.id,
        email,
        email_type: EMAIL_TYPE,
        status: 'processing',
        source_event_id: sourceEventId,
        metadata: { source: 'cron.inactive-accounts', lastActiveDay },
      })
      if (lockError) {
        if (!isDuplicateKeyError(lockError)) summary.failed += 1
        continue
      }
      const result = await sendTransactionalEmail({ to: email, ...buildInactivityWarningEmail(APP_ORIGIN || appUrl) })
      await supabase
        .from('email_events')
        .update(result.success ? { status: 'sent', provider_id: result.providerId } : { status: 'failed', error: result.error, source_event_id: null })
        .eq('source_event_id', sourceEventId)
      if (result.success) summary.warned += 1
      else summary.failed += 1
      continue
    }

    // stage === 'delete'
    const { data: row } = await supabase.from('users').select('stripe_subscription_id').eq('clerk_id', user.id).maybeSingle()
    if (row?.stripe_subscription_id) {
      summary.skipped += 1
      logger.info('Inactive account kept: active subscription', { requestId, userId: user.id })
      continue
    }
    const result = await deleteAccount(user.id, { requestId })
    if (result.ok) summary.deleted += 1
    else summary.failed += 1
  }

  return jsonWithRequestId({ ok: summary.failed === 0, dryRun: options.dryRun, ...summary, plan }, summary.failed === 0 ? 200 : 500, requestId)
}

export const GET = POST
