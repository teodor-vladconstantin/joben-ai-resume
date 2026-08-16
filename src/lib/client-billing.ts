import posthog from 'posthog-js'

export type PaidPlan = 'pro' | 'recruiting'

export async function startCheckout(plan: PaidPlan) {
  // Captured here (click time) rather than only on the server, so we still
  // see the conversion intent if the user abandons before checkout session creation finishes.
  posthog.capture('checkout_started', { plan })

  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan }),
  })

  const payload = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Could not start checkout.')
  }

  if (typeof window !== 'undefined') {
    window.location.assign(payload.url)
  }
}

export async function startProCheckout() {
  return startCheckout('pro')
}

export async function startBillingPortal() {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const payload = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Could not open billing portal.')
  }

  if (typeof window !== 'undefined') {
    window.location.assign(payload.url)
  }
}
