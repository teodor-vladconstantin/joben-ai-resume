import { PostHog } from 'posthog-node'
import { logger } from '@/lib/logger'

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

type CapturePostHogEventInput = {
  distinctId: string
  event: string
  properties?: Record<string, unknown>
}

// Serverless route handlers can freeze/exit right after responding, so each
// call gets its own client and is flushed + shut down before returning
// rather than reusing a long-lived singleton that may never flush.
export async function capturePostHogEvent(input: CapturePostHogEventInput): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!apiKey) return

  const client = new PostHog(apiKey, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })

  try {
    client.capture({
      distinctId: input.distinctId,
      event: input.event,
      properties: input.properties,
    })
  } catch (error) {
    logger.warn('PostHog server-side capture threw error', {
      source: 'capturePostHogEvent',
      event: input.event,
      distinctId: input.distinctId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  } finally {
    try {
      await client.shutdown()
    } catch (error) {
      logger.warn('PostHog server-side client shutdown failed', {
        source: 'capturePostHogEvent',
        event: input.event,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
