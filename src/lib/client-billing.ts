import posthog from 'posthog-js'

export async function startProCheckout() {
  // Captured here (click time) rather than only on the server, so we still
  // see the conversion intent if the user abandons before checkout session creation finishes.
  posthog.capture('checkout_started', { plan: 'pro' })

  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const payload = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Could not start checkout.')
  }

  if (typeof window !== 'undefined') {
    window.location.assign(payload.url)
  }
}
