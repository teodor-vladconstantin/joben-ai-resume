'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { startProCheckout } from '@/lib/client-billing'

export function UpgradeToProButton({ signedIn }: { signedIn: boolean }) {
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
    <Button variant="primary" className="w-full" onClick={() => startProCheckout()}>
      Upgrade to Pro
    </Button>
  )
}
