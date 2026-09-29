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
async function withPostHogClient(label: string, send: (client: PostHog) => void): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!apiKey) return

  const client = new PostHog(apiKey, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })

  try {
    send(client)
  } catch (error) {
    logger.warn('PostHog server-side call threw error', {
      source: 'posthog-server',
      label,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  } finally {
    try {
      await client.shutdown()
    } catch (error) {
      logger.warn('PostHog server-side client shutdown failed', {
        source: 'posthog-server',
        label,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export async function capturePostHogEvent(input: CapturePostHogEventInput): Promise<void> {
  await withPostHogClient(input.event, (client) => {
    client.capture({
      distinctId: input.distinctId,
      event: input.event,
      properties: input.properties,
    })
  })
}

// Merges `alias` (a never-identified browser id) into the person behind
// `distinctId` (the Clerk user id), so the anonymous history shows up in that
// account's timeline and funnels. PostHog ignores it if `alias` already
// belongs to an identified person.
export async function aliasPostHogDistinctId(input: { distinctId: string; alias: string }): Promise<void> {
  await withPostHogClient('alias', (client) => {
    client.alias({ distinctId: input.distinctId, alias: input.alias })
  })
}

// A browser distinct id the client sent along (only when the visitor accepted
// analytics cookies). It is caller-supplied, so it is bounded, charset-limited,
// and never a Clerk user id (`user_…`, what identify() sets after sign-in) or
// one of our server-side ids (`anon:…`, e.g. the IP-hash scan counter):
// otherwise anyone who knows such an id could alias events into that person.
const BROWSER_DISTINCT_ID_PATTERN = /^[A-Za-z0-9_.:@-]{1,200}$/

export function toBrowserDistinctId(value: unknown): string | null {
  if (typeof value !== 'string' || !BROWSER_DISTINCT_ID_PATTERN.test(value)) return null
  if (value.startsWith('user_') || value.startsWith('anon:')) return null
  return value
}
