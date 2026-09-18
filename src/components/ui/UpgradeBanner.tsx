'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { startProCheckout } from '@/lib/client-billing'
import type { AppLocale } from '@/i18n/routing'

type UpgradeBannerProps = {
  open: boolean
  message: string
  onClose: () => void
}

export function UpgradeBanner({ open, message, onClose }: UpgradeBannerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locale = useLocale() as AppLocale
  const t = useTranslations('Billing')

  if (!open) return null

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      await startProCheckout(locale)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('couldNotStartCheckout'))
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md gap-3 rounded-xl border border-(--accent-strong)/35 bg-(--accent-muted) px-4 py-2.5 shadow-lg backdrop-blur">
      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-(--accent-strong)" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-(--foreground)/85">{message}</p>
        {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-(--accent-strong) px-3 py-1.5 text-xs font-medium text-white disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('upgradeToPro')}
        </button>
      </div>
      <button
        onClick={onClose}
        className="text-(--muted) hover:text-(--foreground) text-xs shrink-0"
      >
        x
      </button>
    </div>
  )
}
