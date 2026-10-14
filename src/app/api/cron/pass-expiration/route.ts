import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { isAuthorizedCronRequest, parseCronOptions } from '@/lib/cron-utils'

export const runtime = 'nodejs'

async function handlePassExpiration(request: Request) {
  const requestId = getRequestId(request)
  try {
    if (!isAuthorizedCronRequest(request)) {
      logger.warn('Pass expiration cron request rejected: unauthorized', {
        requestId,
        route: '/api/cron/pass-expiration',
      })
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const options = parseCronOptions(request)
    const supabase = createServerClient()
    const nowIso = new Date().toISOString()

    // Find users whose 14-day pass or referral grant has expired and are still marked 'pro' without recurring subscription
    const { data: expiredUsers, error } = await supabase
      .from('users')
      .select('id, clerk_id, email, pro_expires_at, stripe_subscription_id')
      .eq('plan', 'pro')
      .is('stripe_subscription_id', null)
      .is('lifetime_recruiting_unlocked', false)
      .lt('pro_expires_at', nowIso)
      .limit(options.limit)

    if (error) {
      logger.error('Failed to query expired pass users', {
        requestId,
        route: '/api/cron/pass-expiration',
        error: error.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      return jsonWithRequestId({ processed: 0, message: 'No expired passes found.' }, 200, requestId)
    }

    let downgradedCount = 0
    for (const user of expiredUsers) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          plan: 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (!updateError) {
        downgradedCount++
        logger.info('User Pro pass expired, reverted to free plan', {
          requestId,
          userId: user.id,
          clerkId: user.clerk_id,
          proExpiresAt: user.pro_expires_at,
        })
      }
    }

    return jsonWithRequestId(
      {
        processed: expiredUsers.length,
        downgraded: downgradedCount,
        message: `Successfully downgraded ${downgradedCount} expired pass users to free.`,
      },
      200,
      requestId
    )
  } catch (err) {
    logger.error('Pass expiration cron unexpected error', {
      requestId,
      route: '/api/cron/pass-expiration',
      error: err instanceof Error ? err.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}

export async function GET(request: Request) {
  return handlePassExpiration(request)
}

export async function POST(request: Request) {
  return handlePassExpiration(request)
}
