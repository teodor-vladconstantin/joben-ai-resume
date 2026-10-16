'use client'

import { useEffect } from 'react'
import { pushGtmEvent } from '@/lib/gtm-events'
import { PASS_14D_PRICE_BANI } from '@/lib/content'

const TRACKED_KEY = 'joben_purchase_tracked'

// Fires GA4 `purchase` once per tab after Stripe returns to ?upgrade=success.
// Browser-side on purpose: Consent Mode drops it for visitors who declined
// analytics, which a server-side Measurement Protocol call would not. The
// subscription price is not known here, so only the pass carries a value.
export function PurchaseTracker({ plan }: { plan: 'pass_14d' | 'subscription' }) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(TRACKED_KEY)) return
      sessionStorage.setItem(TRACKED_KEY, '1')
    } catch {
      // storage blocked: fall through and track once per mount
    }
    const base = { plan, transaction_id: `${plan}-${Date.now()}` }
    pushGtmEvent(
      'purchase',
      plan === 'pass_14d' ? { ...base, currency: 'RON', value: PASS_14D_PRICE_BANI / 100 } : base,
    )
  }, [plan])

  return null
}
