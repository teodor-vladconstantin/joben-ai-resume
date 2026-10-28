'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { checkoutErrorKey, startBillingPortal, startProCheckout } from '@/lib/client-billing'
import type { AppLocale } from '@/i18n/routing'

type ManageBillingButtonProps = {
  hasSubscription: boolean
}

export function ManageBillingButton({ hasSubscription }: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locale = useLocale() as AppLocale
  const t = useTranslations('Billing')

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      if (hasSubscription) {
        await startBillingPortal(locale)
      } else {
        await startProCheckout(locale)
      }
    } catch (err) {
      setError(hasSubscription ? t('couldNotOpenPortal') : t(checkoutErrorKey(err)))
      setLoading(false)
    }
  }

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? '...' : hasSubscription ? t('manageBilling') : t('upgradeToPro')}
      </Button>
      {error ? <p className="mt-2 text-xs text-foreground border-l-2 border-foreground pl-2">{error}</p> : null}
    </div>
  )
}
