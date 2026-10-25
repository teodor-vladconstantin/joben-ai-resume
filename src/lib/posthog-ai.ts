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

// Tracing must never fail the AI call it observes.
export async function flushPostHogAi(): Promise<void> {
  try {
    await posthogAi.flush()
  } catch {
    // observability only
  }
}
