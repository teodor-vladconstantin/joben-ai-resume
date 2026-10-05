import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// Webhook handlers claim an event id in `webhook_events` before processing so
// retries are idempotent. If processing then fails with a 5xx, the claim must
// be released, otherwise the provider's retry hits the unique index and is
// answered "duplicate" (200), permanently losing the update.
export type WebhookClaimContext = {
  release: (() => Promise<void>) | null
}

export function setClaim(
  ctx: WebhookClaimContext,
  supabase: SupabaseClient,
  provider: string,
  eventId: string
): void {
  ctx.release = async () => {
    const { error } = await supabase
      .from('webhook_events')
      .delete()
      .eq('provider', provider)
      .eq('event_id', eventId)
    if (error) {
      logger.error('Failed to release webhook claim', { provider, eventId, error: error.message })
    }
  }
}

export async function runWithClaimRelease(
  handler: (ctx: WebhookClaimContext) => Promise<Response>
): Promise<Response> {
  const ctx: WebhookClaimContext = { release: null }
  let response: Response
  try {
    response = await handler(ctx)
  } catch (error) {
    await ctx.release?.()
    throw error
  }
  if (response.status >= 500) await ctx.release?.()
  return response
}
