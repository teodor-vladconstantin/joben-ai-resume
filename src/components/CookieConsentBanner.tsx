'use client'

import { useEffect, useState } from 'react'
import { AppLink } from '@/components/ui/AppLink'
import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import { COOKIE_SETTINGS_OPEN_EVENT, getCookieConsent, setCookieConsent } from '@/lib/cookie-consent'
import { pushConsentUpdate } from '@/lib/consent-mode'
import { enableSentryReplay } from '@/lib/sentry-replay'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const t = useTranslations('CookieConsent')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount read of localStorage, not a subscribable external store
    setVisible(getCookieConsent() === null)

    // The footer "Cookie settings" link reopens the banner so the choice can be changed.
    const reopen = () => setVisible(true)
    window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, reopen)
    return () => window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, reopen)
  }, [])

  if (!visible) return null

  const handleAccept = () => {
    setCookieConsent('accepted')
    posthog.opt_in_capturing()
    pushConsentUpdate(true)
    enableSentryReplay()
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
      aria-label={t('ariaLabel')}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card px-4 py-4 sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t('messagePrefix')}{' '}
          <AppLink href="/cookies" className="text-foreground border-b border-transparent hover:border-primary transition-colors duration-150 ease-out">
            {t('cookiePolicyLinkText')}
          </AppLink>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={handleReject}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:bg-card sm:flex-none"
          >
            {t('rejectNonEssential')}
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:bg-card sm:flex-none"
          >
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  )
}
