import { PostHog } from 'posthog-node'

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

// Shared client for the @posthog/ai Anthropic wrapper. Without a token (local
// dev, CI) it is disabled instead of throwing at import time, which would take
// every route that imports it down. privacyMode keeps prompts and completions
// out of PostHog: the ATS checker sends a stranger's CV text, and the site
// promises the file is discarded after the scan. Tokens, cost and latency still
// arrive.
export const posthogAi = new PostHog(token || 'phc_disabled', {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
  flushAt: 1,
  flushInterval: 0,
  privacyMode: true,
  disabled: !token,
})

// Spread into every request made through the wrapper. The client-level
// privacyMode above already redacts prompts and completions (the wrapper reads
// client.options.privacyMode); the per-request flag keeps that true even if the
// client option stops being honored after a library upgrade.
export const POSTHOG_AI_PRIVATE = { posthogPrivacyMode: true } as const

const FLUSH_TIMEOUT_MS = 1500

// Tracing must never fail or slow the AI call it observes: a flush that errors
// or takes longer than FLUSH_TIMEOUT_MS is abandoned and the caller carries on.
export async function flushPostHogAi(): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      posthogAi.flush(),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, FLUSH_TIMEOUT_MS)
      }),
    ])
  } catch {
    // observability only
  } finally {
    if (timer) clearTimeout(timer)
  }
}
