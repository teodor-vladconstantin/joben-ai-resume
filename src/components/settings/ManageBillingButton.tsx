'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { startBillingPortal, startProCheckout } from '@/lib/client-billing'

type ManageBillingButtonProps = {
  hasStripeCustomer: boolean
}

export function ManageBillingButton({ hasStripeCustomer }: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      if (hasStripeCustomer) {
        await startBillingPortal()
      } else {
        await startProCheckout()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? '...' : hasStripeCustomer ? 'Manage Billing' : 'Upgrade to Pro'}
      </Button>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
