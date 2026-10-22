import { clerkClient } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { getStripeClient, isStripeConfigured } from '@/lib/stripe'

export const OWNED_TABLES = ['resume_analyses', 'ai_reviews', 'resumes', 'cover_letters', 'feedback'] as const

// Tables that key the user by a differently named column. email_suppressions
// is intentionally kept: it is the opt-out record that stops us re-mailing the
// address, and holds no data beyond the address and reason.
export const OTHER_OWNED_TABLES = [
  { table: 'email_events', column: 'user_clerk_id' },
  { table: 'product_events', column: 'user_clerk_id' },
  { table: 'anonymous_scans', column: 'claimed_by' },
  // Both sides of a referral: who this user invited and who invited them.
  { table: 'referrals', column: 'referrer_id' },
  { table: 'referrals', column: 'referred_user_id' },
] as const

export type AccountDeletionResult = { ok: true } | { ok: false; reason: 'stripe' | 'data' }

function isMissingStripeResource(error: unknown): boolean {
  const err = error as { code?: string; statusCode?: number }
  return err?.code === 'resource_missing' || err?.statusCode === 404
}

// Shared by the user-initiated route (/api/account/delete, behind Clerk
// reverification) and the inactive-account cron, so both erase exactly the
// same data in the same order.
export async function deleteAccount(userId: string, context: { requestId: string }): Promise<AccountDeletionResult> {
  const { requestId } = context
  const supabase = createServerClient()

  const { data: user, error: userLookupError } = await supabase
    .from('users')
    .select('stripe_subscription_id, email')
    .eq('clerk_id', userId)
    .maybeSingle()

  if (userLookupError) {
    logger.error('Account deletion: user lookup failed', { requestId, userId, error: userLookupError.message })
    return { ok: false, reason: 'data' }
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
        return { ok: false, reason: 'stripe' }
      }
      logger.warn('Account deletion: Stripe subscription already gone', { requestId, userId })
    }
  }

  for (const table of OWNED_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) {
      logger.error('Account deletion: row delete failed', { requestId, userId, table, error: error.message })
      return { ok: false, reason: 'data' }
    }
  }

  for (const { table, column } of OTHER_OWNED_TABLES) {
    const { error } = await supabase.from(table).delete().eq(column, userId)
    if (error) {
      logger.error('Account deletion: row delete failed', { requestId, userId, table, error: error.message })
      return { ok: false, reason: 'data' }
    }
  }

  // Scans captured before signup are linked by the (verified) email address.
  if (user?.email) {
    const { error } = await supabase.from('anonymous_scans').delete().eq('email', user.email)
    if (error) {
      logger.error('Account deletion: anonymous_scans email delete failed', { requestId, userId, error: error.message })
      return { ok: false, reason: 'data' }
    }
  }

  const { error: userDeleteError } = await supabase.from('users').delete().eq('clerk_id', userId)
  if (userDeleteError) {
    logger.error('Account deletion: users row delete failed', { requestId, userId, error: userDeleteError.message })
    return { ok: false, reason: 'data' }
  }

  try {
    const client = await clerkClient()
    await client.users.deleteUser(userId)
  } catch (error) {
    // Supabase data is already gone at this point; log so we can manually
    // clean up the Clerk account, but don't fail the request: the user's
    // data has been erased, which is the GDPR-relevant outcome.
    logger.error('Account deletion: Clerk user delete failed', {
      requestId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  logger.info('Account deleted', { requestId, userId })
  return { ok: true }
}
