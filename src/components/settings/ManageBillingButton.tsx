'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { startBillingPortal, startProCheckout } from '@/lib/client-billing'
import type { AppLocale } from '@/i18n/routing'

type ManageBillingButtonProps = {
  hasStripeCustomer: boolean
}

export function ManageBillingButton({ hasStripeCustomer }: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locale = useLocale() as AppLocale
  const t = useTranslations('Billing')

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      if (hasStripeCustomer) {
        await startBillingPortal(locale)
      } else {
        await startProCheckout(locale)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('somethingWentWrong'))
      setLoading(false)
    }
  }

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? '...' : hasStripeCustomer ? t('manageBilling') : t('upgradeToPro')}
      </Button>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
