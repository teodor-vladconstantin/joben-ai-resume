import { auth, clerkClient } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getRequestId, logger } from '@/lib/logger'
import { getStripeClient, isStripeConfigured } from '@/lib/stripe'

export const OWNED_TABLES = ['resume_analyses', 'ai_reviews', 'resumes', 'cover_letters', 'feedback'] as const

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const { userId } = await auth()
  if (!userId) {
    return apiError('You must be signed in.', 401, requestId)
  }

  const supabase = createServerClient()

  const { data: user, error: userLookupError } = await supabase
    .from('users')
    .select('stripe_subscription_id')
    .eq('clerk_id', userId)
    .maybeSingle()

  if (userLookupError) {
    logger.error('Account deletion: user lookup failed', { requestId, userId, error: userLookupError.message })
    return apiError('Could not process account deletion.', 500, requestId)
  }

  if (user?.stripe_subscription_id && isStripeConfigured()) {
    try {
      await getStripeClient().subscriptions.cancel(user.stripe_subscription_id)
    } catch (error) {
      // Already-canceled or missing subscriptions must not block deletion.
      logger.warn('Account deletion: Stripe subscription cancel failed', {
        requestId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  for (const table of OWNED_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) {
      logger.error('Account deletion: row delete failed', { requestId, userId, table, error: error.message })
      return apiError('Could not process account deletion.', 500, requestId)
    }
  }

  const { error: emailEventsError } = await supabase.from('email_events').delete().eq('user_clerk_id', userId)
  if (emailEventsError) {
    logger.error('Account deletion: email_events delete failed', { requestId, userId, error: emailEventsError.message })
    return apiError('Could not process account deletion.', 500, requestId)
  }

  const { error: userDeleteError } = await supabase.from('users').delete().eq('clerk_id', userId)
  if (userDeleteError) {
    logger.error('Account deletion: users row delete failed', { requestId, userId, error: userDeleteError.message })
    return apiError('Could not process account deletion.', 500, requestId)
  }

  try {
    const client = await clerkClient()
    await client.users.deleteUser(userId)
  } catch (error) {
    // Supabase data is already gone at this point; log so we can manually
    // clean up the Clerk account, but don't fail the request — the user's
    // data has been erased, which is the GDPR-relevant outcome.
    logger.error('Account deletion: Clerk user delete failed', {
      requestId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  logger.info('Account deleted', { requestId, userId })
  return apiSuccess({ deleted: true }, 200, requestId)
}
