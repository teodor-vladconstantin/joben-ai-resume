'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { getCookieConsent, setCookieConsent } from '@/lib/cookie-consent'
import { pushConsentUpdate } from '@/lib/consent-mode'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount read of localStorage, not a subscribable external store
    setVisible(getCookieConsent() === null)
  }, [])

  if (!visible) return null

  const handleAccept = () => {
    setCookieConsent('accepted')
    posthog.opt_in_capturing()
    pushConsentUpdate(true)
    setVisible(false)
  }

  const handleReject = () => {
    setCookieConsent('rejected')
    posthog.opt_out_capturing()
    pushConsentUpdate(false)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-(--border) bg-(--surface) px-4 py-4 sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-(--muted)">
          We use strictly necessary cookies to run Joben, and optional analytics cookies to improve it. See our{' '}
          <Link href="/cookies" className="text-(--accent) hover:text-(--accent-strong)">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={handleReject}
            className="flex-1 rounded-md border border-(--border) px-4 py-2 text-sm font-medium text-(--foreground) hover:bg-(--surface-elevated) sm:flex-none"
          >
            Reject non-essential
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 rounded-md bg-(--accent) px-4 py-2 text-sm font-medium text-(--background) hover:bg-(--accent-strong) sm:flex-none"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
