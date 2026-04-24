"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Gift, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { UserPlan } from '@/lib/plans'

type RedeemCodeCardProps = {
  currentPlan: UserPlan
}

export function RedeemCodeCard({ currentPlan }: RedeemCodeCardProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const alreadyRecruiting = currentPlan === 'recruiting'

  async function handleRedeem() {
    if (alreadyRecruiting) {
      setErrorMessage(null)
      setSuccessMessage('Recruiting lifetime plan is already active on your account.')
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    const trimmedCode = code.trim()
    if (!trimmedCode) {
      setErrorMessage('Enter a valid code.')
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
        setErrorMessage(payload.error || 'Could not redeem code right now.')
        return
      }

      setSuccessMessage(payload.message || 'Recruiting lifetime plan is now active.')
      setCode('')
      router.refresh()
    } catch (error) {
      setErrorMessage((error as Error).message || 'Could not redeem code right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="bg-[#0A0F0D] p-6 rounded-2xl border border-white/10 mb-8"
      suppressHydrationWarning
    >
      <div className="flex items-start justify-between gap-4 mb-4" suppressHydrationWarning>
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#0A9548]" /> Redeem Access Code
          </h3>
          <p className="text-sm text-[#FFFFFF]/72 mt-1">
            Activate special access instantly. Code is case-insensitive.
          </p>
        </div>
        {alreadyRecruiting ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#0A9548]/40 bg-[#0A9548]/10 px-3 py-1 text-xs font-semibold text-[#16DB65]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Recruiting Active
          </span>
        ) : null}
      </div>

      <div className="flex flex-col sm:flex-row gap-3" suppressHydrationWarning>
        <motion.input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter private access code"
          disabled={isSubmitting || alreadyRecruiting}
          className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none disabled:opacity-60"
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
        <motion.button
          type="button"
          onClick={() => void handleRedeem()}
          disabled={isSubmitting || alreadyRecruiting}
          className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {alreadyRecruiting ? 'Already Active' : isSubmitting ? 'Applying...' : 'Redeem Code'}
        </motion.button>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-[#16DB65]">{errorMessage}</p>
      ) : null}

      {successMessage ? (
        <p className="mt-3 text-sm text-[#16DB65]">{successMessage}</p>
      ) : null}
    </motion.div>
  )
}

