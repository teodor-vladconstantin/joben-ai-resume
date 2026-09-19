"use client"

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { CheckCircle2, Gift, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/lib/plans'
import { buttonVariants } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type RedeemCodeCardProps = {
  currentPlan: UserPlan
}

export function RedeemCodeCard({ currentPlan }: RedeemCodeCardProps) {
  const t = useTranslations('Dashboard.redeemCode')
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const alreadyRecruiting = currentPlan === 'recruiting'

  async function handleRedeem() {
    if (alreadyRecruiting) {
      setErrorMessage(null)
      setSuccessMessage(t('alreadyActiveMessage'))
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    const trimmedCode = code.trim()
    if (!trimmedCode) {
      setErrorMessage(t('enterValidCode'))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/billing/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: trimmedCode }),
      })

      const payload = (await response.json()) as {
        success?: boolean
        message?: string
        error?: string
      }

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error || t('couldNotRedeem'))
        return
      }

      setSuccessMessage(payload.message || t('successDefault'))
      setCode('')
      router.refresh()
    } catch (error) {
      setErrorMessage((error as Error).message || t('couldNotRedeem'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-(--surface) p-6 border border-(--border) mb-8" suppressHydrationWarning>
      <div className="flex items-start justify-between gap-4 mb-4" suppressHydrationWarning>
        <div>
          <h3 className="text-lg font-bold text-(--foreground) flex items-center gap-2">
            <Gift className="w-5 h-5 text-(--muted)" /> {t('heading')}
          </h3>
          <p className="text-sm text-(--muted) mt-1">
            {t('subtext')}
          </p>
        </div>
        {alreadyRecruiting ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-(--foreground)">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('alreadyActiveBadge')}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col sm:flex-row gap-3" suppressHydrationWarning>
        <Input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t('placeholder')}
          disabled={isSubmitting || alreadyRecruiting}
        />
        <button
          type="button"
          onClick={() => void handleRedeem()}
          disabled={isSubmitting || alreadyRecruiting}
          className={`min-w-36 disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {alreadyRecruiting ? t('alreadyActiveButton') : isSubmitting ? t('applying') : t('redeemButton')}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-(--foreground) border-l-2 border-(--foreground) pl-2">{errorMessage}</p>
      ) : null}

      {successMessage ? (
        <p className="mt-3 text-sm text-(--foreground)">{successMessage}</p>
      ) : null}
    </div>
  )
}
