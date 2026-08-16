'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { startCheckout, type PaidPlan } from '@/lib/client-billing'

const VALID_PLANS: PaidPlan[] = ['pro', 'recruiting']

function isPaidPlan(value: string | null): value is PaidPlan {
  return value !== null && (VALID_PLANS as string[]).includes(value)
}

// Resumes checkout automatically after a signed-out visitor is bounced through
// sign-up from a pricing CTA (see PlanCta) and lands back on /pricing?startCheckout=<plan>
// already authenticated.
export function AutoResumeCheckout() {
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const requestedPlan = searchParams.get('startCheckout')

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isPaidPlan(requestedPlan)) return

    let cancelled = false
    startCheckout(requestedPlan).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : 'Could not start checkout.')
    })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, requestedPlan])

  if (!isPaidPlan(requestedPlan) || (isLoaded && !isSignedIn)) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--background)/90 backdrop-blur-sm">
      <div className="max-w-sm px-6 text-center">
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-(--accent)" />
            <p className="mt-3 text-sm text-(--muted)">Redirecting you to secure checkout...</p>
          </>
        )}
      </div>
    </div>
  )
}
