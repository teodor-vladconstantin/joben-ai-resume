// Single source of truth for the Upstash Redis client. Previously
// constructed independently in ratelimit.ts and health/route.ts — this
// module centralizes it so both the rate limiter and the health/alerting
// probes agree on configuration.
import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'

const client = env.upstash.isConfigured
  ? new Redis({
      url: env.upstash.url!,
      token: env.upstash.token!,
    })
  : null

export function getUpstashClient(): Redis | null {
  return client
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout)
        reject(new Error('Timed out'))
      }, timeoutMs)
    }),
  ])
}

export type UpstashPingResult = { ok: boolean; reason?: string }

export async function pingUpstash(timeoutMs = 2500): Promise<UpstashPingResult> {
  if (!client) {
    return { ok: false, reason: 'not_configured' }
  }
  try {
    await withTimeout(client.ping(), timeoutMs)
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'unknown_error' }
  }
}
