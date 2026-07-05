'use client'

import { useState } from 'react'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'

type PlanCtaProps = {
  label: string
  className?: string
  // Paid plans intercept the click and open the "payments not active yet"
  // beta modal instead of routing anywhere. The free plan keeps its normal
  // sign-up / dashboard link.
  paid: boolean
}

export function PlanCta({ label, className, paid }: PlanCtaProps) {
  const [open, setOpen] = useState(false)

  if (!paid) {
    return <AuthAwareSignupLink className={className}>{label}</AuthAwareSignupLink>
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
