'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { UpgradeModal } from '@/components/ui/UpgradeModal'

// Payments are disabled during the beta, so the upgrade button always opens
// the "payments not active yet" modal — regardless of auth state — instead of
// starting checkout or routing to sign-up.
export function UpgradeToProButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
        Upgrade to Pro
      </Button>
      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
