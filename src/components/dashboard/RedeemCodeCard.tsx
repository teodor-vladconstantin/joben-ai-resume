"use client"

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { CheckCircle2, Gift, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/lib/plans'
import { buttonVariants } from '@/components/ui/Button'

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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="bg-(--surface) p-6 rounded-2xl border border-(--border) mb-8"
      suppressHydrationWarning
    >
      <div className="flex items-start justify-between gap-4 mb-4" suppressHydrationWarning>
        <div>
          <h3 className="text-lg font-bold text-(--foreground) flex items-center gap-2">
            <Gift className="w-5 h-5 text-(--accent)" /> {t('heading')}
          </h3>
          <p className="text-sm text-(--muted) mt-1">
            {t('subtext')}
          </p>
        </div>
        {alreadyRecruiting ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-(--accent)/40 bg-(--accent-muted) px-3 py-1 text-xs font-semibold text-(--accent)">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('alreadyActiveBadge')}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col sm:flex-row gap-3" suppressHydrationWarning>
        <motion.input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t('placeholder')}
          disabled={isSubmitting || alreadyRecruiting}
          className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent) focus:outline-none disabled:opacity-60"
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
        <motion.button
          type="button"
          onClick={() => void handleRedeem()}
          disabled={isSubmitting || alreadyRecruiting}
          className={`min-w-36 disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {alreadyRecruiting ? t('alreadyActiveButton') : isSubmitting ? t('applying') : t('redeemButton')}
        </motion.button>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
      ) : null}

      {successMessage ? (
        <p className="mt-3 text-sm text-(--accent)">{successMessage}</p>
      ) : null}
    </motion.div>
  )
}
