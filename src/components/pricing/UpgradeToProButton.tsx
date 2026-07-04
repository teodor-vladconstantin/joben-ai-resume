'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { UpgradeModal } from '@/components/ui/UpgradeModal'

export function UpgradeToProButton({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false)

  if (!signedIn) {
    return (
      <Link href="/sign-up" className="block w-full text-center">
        <Button variant="primary" className="w-full">
          Upgrade to Pro
        </Button>
      </Link>
    )
  }

  return (
    <>
      <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
        Upgrade to Pro
      </Button>
      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
