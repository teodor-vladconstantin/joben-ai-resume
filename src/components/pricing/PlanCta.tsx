'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { startCheckout, type PaidPlan } from '@/lib/client-billing'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'

type PlanCtaProps = {
  label: string
  className?: string
  plan?: PaidPlan
}

export function PlanCta({ label, className, plan }: PlanCtaProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!plan) {
    return <AuthAwareSignupLink className={className}>{label}</AuthAwareSignupLink>
  }

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      await startCheckout(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button type="button" className={className} onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : label}
      </button>
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
    </div>
  )
}
