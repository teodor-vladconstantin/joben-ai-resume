'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { COOKIE_CONSENT_EVENT, getCookieConsent } from '@/lib/cookie-consent'

export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount read of localStorage, not a subscribable external store
    setEnabled(getCookieConsent() === 'accepted')

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      setEnabled(detail === 'accepted')
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, handleChange)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handleChange)
  }, [])

  if (!enabled) return null
  return <Analytics />
}
