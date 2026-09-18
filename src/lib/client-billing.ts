import posthog from 'posthog-js'
import type { AppLocale } from '@/i18n/routing'

export type PaidPlan = 'pro' | 'recruiting'

export async function startCheckout(plan: PaidPlan, locale: AppLocale) {
  // Captured here (click time) rather than only on the server, so we still
  // see the conversion intent if the user abandons before checkout session creation finishes.
  posthog.capture('checkout_started', { plan })

  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan, locale }),
  })

  const payload = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Could not start checkout.')
  }

  if (typeof window !== 'undefined') {
    window.location.assign(payload.url)
  }
}

export async function startProCheckout(locale: AppLocale) {
  return startCheckout('pro', locale)
}

export async function startBillingPortal(locale: AppLocale) {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ locale }),
  })

  const payload = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Could not open billing portal.')
  }

  if (typeof window !== 'undefined') {
    window.location.assign(payload.url)
  }
}
