'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { checkoutErrorKey, startCheckout, type PaidPlan } from '@/lib/client-billing'
import type { AppLocale } from '@/i18n/routing'

const VALID_PLANS: PaidPlan[] = ['pro', 'recruiting', 'pass_14d']

function isPaidPlan(value: string | null): value is PaidPlan {
  return value !== null && (VALID_PLANS as string[]).includes(value)
}

// Resumes checkout automatically after a signed-out visitor is bounced through
// sign-up from a pricing CTA (see PlanCta) and lands back on /pricing?startCheckout=<plan>
// already authenticated.
export function AutoResumeCheckout() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { isLoaded, isSignedIn } = useAuth()
  const locale = useLocale() as AppLocale
  const t = useTranslations('Billing')
  const [error, setError] = useState<string | null>(null)
  // Read once: the param is stripped from the URL before redirecting.
  const [requestedPlan] = useState(() => searchParams.get('startCheckout'))
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !isLoaded || !isSignedIn || !isPaidPlan(requestedPlan)) return
    started.current = true

    // Drop ?startCheckout so Back from Stripe does not start checkout again.
    router.replace(pathname, { scroll: false })
    startCheckout(requestedPlan, locale).catch((err) => setError(t(checkoutErrorKey(err))))
  }, [isLoaded, isSignedIn, requestedPlan, locale, t, router, pathname])

  if (!isPaidPlan(requestedPlan) || (isLoaded && !isSignedIn)) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95">
      <div className="max-w-sm px-6 text-center">
        {error ? (
          <p className="text-sm text-foreground border-l-2 border-foreground pl-2">{error}</p>
        ) : (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">{t('redirectingToCheckout')}</p>
          </>
        )}
      </div>
    </div>
  )
}
