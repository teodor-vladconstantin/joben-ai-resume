import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const OWNED_TABLES = ['resume_analyses', 'ai_reviews', 'resumes', 'cover_letters', 'feedback'] as const

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return apiError('You must be signed in.', 401)
  }

  const supabase = createServerClient()

  const { data: user, error: userLookupError } = await supabase
    .from('users')
    .select('stripe_subscription_id')
    .eq('clerk_id', userId)
    .maybeSingle()

  if (userLookupError) {
    logger.error('Account deletion: user lookup failed', { userId, error: userLookupError.message })
    return apiError('Could not process account deletion.', 500)
  }

  if (user?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(user.stripe_subscription_id)
    } catch (error) {
      // Already-canceled or missing subscriptions must not block deletion.
      logger.warn('Account deletion: Stripe subscription cancel failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  for (const table of OWNED_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) {
      logger.error('Account deletion: row delete failed', { userId, table, error: error.message })
      return apiError('Could not process account deletion.', 500)
    }
  }

  const { error: emailEventsError } = await supabase.from('email_events').delete().eq('user_clerk_id', userId)
  if (emailEventsError) {
    logger.error('Account deletion: email_events delete failed', { userId, error: emailEventsError.message })
    return apiError('Could not process account deletion.', 500)
  }

  const { error: userDeleteError } = await supabase.from('users').delete().eq('clerk_id', userId)
  if (userDeleteError) {
    logger.error('Account deletion: users row delete failed', { userId, error: userDeleteError.message })
    return apiError('Could not process account deletion.', 500)
  }

  try {
    const client = await clerkClient()
    await client.users.deleteUser(userId)
  } catch (error) {
    // Supabase data is already gone at this point; log so we can manually
    // clean up the Clerk account, but don't fail the request — the user's
    // data has been erased, which is the GDPR-relevant outcome.
    logger.error('Account deletion: Clerk user delete failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  logger.info('Account deleted', { userId })
  return apiSuccess({ deleted: true })
}
