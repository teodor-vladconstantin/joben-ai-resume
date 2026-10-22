'use client'

import { useEffect, useState } from 'react'
import { GoogleTagManager } from '@next/third-parties/google'
import { COOKIE_CONSENT_EVENT, getCookieConsent } from '@/lib/cookie-consent'

// GTM (and the GA4 tag inside it) is not loaded at all until the visitor
// accepts analytics cookies: with Consent Mode alone, a denied tag would still
// send cookieless pings to Google (Law 506/2004 art. 4(5) covers that access).
export function GtmGate({ gtmId }: { gtmId: string }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount read of localStorage, not a subscribable external store
    setEnabled(getCookieConsent() === 'accepted')

    const handleChange = (event: Event) => {
      if ((event as CustomEvent<string>).detail === 'accepted') setEnabled(true)
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, handleChange)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handleChange)
  }, [])

  // Once loaded, the script cannot be unloaded; withdrawing consent after that
  // takes effect on the next page load (and consent mode is set to denied now).
  return enabled ? <GoogleTagManager gtmId={gtmId} /> : null
}
