import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export type ProductEventName =
  | 'resume_created'
  | 'cover_letter_created'
  | 'resume_analyzed'
  | 'bullet_improved'
  | 'resume_exported_pdf'
  | 'cover_letter_exported_pdf'
  | 'checkout_started'

type TrackProductEventInput = {
  userId: string
  eventName: ProductEventName
  requestId?: string
  metadata?: Record<string, unknown>
}

export async function trackProductEvent(input: TrackProductEventInput): Promise<void> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from('product_events').insert({
      user_clerk_id: input.userId,
      event_name: input.eventName,
      context: {
        ...(input.metadata || {}),
        requestId: input.requestId || null,
      },
    })

    if (error) {
      logger.warn('Failed to insert product event', {
        source: 'trackProductEvent',
        userId: input.userId,
        eventName: input.eventName,
        requestId: input.requestId,
        error: error.message,
      })
    }
  } catch (error) {
    logger.warn('Product event tracking threw error', {
      source: 'trackProductEvent',
      userId: input.userId,
      eventName: input.eventName,
      requestId: input.requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
