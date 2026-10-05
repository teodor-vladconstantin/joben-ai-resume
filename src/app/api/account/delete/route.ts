import { auth, clerkClient, reverificationErrorResponse } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getRequestId, logger } from '@/lib/logger'
import { getStripeClient, isStripeConfigured } from '@/lib/stripe'

export const OWNED_TABLES = ['resume_analyses', 'ai_reviews', 'resumes', 'cover_letters', 'feedback'] as const

// Tables that key the user by a differently named column. email_suppressions
// is intentionally kept: it is the opt-out record that stops us re-mailing the
// address, and holds no data beyond the address and reason.
export const OTHER_OWNED_TABLES = [
  { table: 'email_events', column: 'user_clerk_id' },
  { table: 'product_events', column: 'user_clerk_id' },
  { table: 'anonymous_scans', column: 'claimed_by' },
] as const

function isMissingStripeResource(error: unknown): boolean {
  const err = error as { code?: string; statusCode?: number }
  return err?.code === 'resource_missing' || err?.statusCode === 404
}

function isConfirmed(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as { confirm?: unknown }).confirm === true
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const { userId, has } = await auth()
  if (!userId) {
    return apiError('You must be signed in.', 401, requestId)
  }

  // SECURITY: irreversible, so a hijacked or idle session is not enough:
  // Clerk asks the user to re-verify (first factor within the last 10 min).
  if (!has({ reverification: 'strict' })) {
    return reverificationErrorResponse('strict')
  }

  // SECURITY: irreversible action. Requiring an explicit JSON confirmation
  // means a cross-site form post or a stray request cannot trigger it.
  const body = await req.json().catch(() => null)
  if (!isConfirmed(body)) {
    return apiError('Confirmation required.', 400, requestId)
  }

  const supabase = createServerClient()

  const { data: user, error: userLookupError } = await supabase
    .from('users')
    .select('stripe_subscription_id, email')
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
      // Already-canceled or missing subscriptions must not block deletion, but
      // any other failure aborts: deleting the account while the subscription
      // is still active would keep billing a customer who can no longer log in.
      if (!isMissingStripeResource(error)) {
        logger.error('Account deletion: Stripe subscription cancel failed, aborting', {
          requestId,
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        return apiError('Could not cancel your subscription. Your account was not deleted, please try again.', 502, requestId)
      }
      logger.warn('Account deletion: Stripe subscription already gone', { requestId, userId })
    }
  }

  for (const table of OWNED_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) {
      logger.error('Account deletion: row delete failed', { requestId, userId, table, error: error.message })
      return apiError('Could not process account deletion.', 500, requestId)
    }
  }

  for (const { table, column } of OTHER_OWNED_TABLES) {
    const { error } = await supabase.from(table).delete().eq(column, userId)
    if (error) {
      logger.error('Account deletion: row delete failed', { requestId, userId, table, error: error.message })
      return apiError('Could not process account deletion.', 500, requestId)
    }
  }

  // Scans captured before signup are linked by the (verified) email address.
  if (user?.email) {
    const { error } = await supabase.from('anonymous_scans').delete().eq('email', user.email)
    if (error) {
      logger.error('Account deletion: anonymous_scans email delete failed', { requestId, userId, error: error.message })
      return apiError('Could not process account deletion.', 500, requestId)
    }
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
