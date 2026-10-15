'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { checkoutErrorKey, startCheckout, type PaidPlan } from '@/lib/client-billing'
import { buttonVariants } from '@/components/ui/Button'
import type { AppLocale } from '@/i18n/routing'

type UpgradeBannerProps = {
  open: boolean
  message: string
  onClose: () => void
}

export function UpgradeBanner({ open, message, onClose }: UpgradeBannerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The pass only makes sense on the free plan; offered once the plan is known.
  const [isFreePlan, setIsFreePlan] = useState(false)
  const locale = useLocale() as AppLocale
  const t = useTranslations('Billing')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch('/api/rate-limit-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { data?: { plan?: string } } | null) => {
        if (!cancelled) setIsFreePlan(payload?.data?.plan === 'free')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open])

  if (!open) return null

  const handleCheckout = async (plan: PaidPlan) => {
    setLoading(true)
    setError(null)
    try {
      await startCheckout(plan, locale)
    } catch (err) {
      setError(t(checkoutErrorKey(err)))
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg gap-3 border border-(--border) bg-(--surface) px-4 py-3 shadow-xl">
      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-(--muted)" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-(--foreground)/90 font-medium">{message}</p>
        {error ? <p className="mt-1 text-sm text-(--foreground) border-l-2 border-(--foreground) pl-1.5">{error}</p> : null}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {isFreePlan ? (
            <button
              onClick={() => handleCheckout('pass_14d')}
              disabled={loading}
              className={`disabled:opacity-70 ${buttonVariants('primary', 'sm')}`}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('buyPass')}
            </button>
          ) : null}
          <button
            onClick={() => handleCheckout('pro')}
            disabled={loading}
            className={`disabled:opacity-70 ${buttonVariants(isFreePlan ? 'secondary' : 'primary', 'sm')}`}
          >
            {t('upgradeToPro')}
          </button>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-(--muted) hover:text-(--foreground) text-xs shrink-0 transition-colors duration-150 ease-out"
      >
        x
      </button>
    </div>
  )
}
