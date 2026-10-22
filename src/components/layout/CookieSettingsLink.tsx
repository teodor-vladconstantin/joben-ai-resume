'use client'

import { useTranslations } from 'next-intl'
import { openCookieSettings } from '@/lib/cookie-consent'

export function CookieSettingsLink() {
  const t = useTranslations('CookieConsent')

  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="text-sm text-(--muted) transition-colors duration-150 ease-out hover:text-(--foreground)"
    >
      {t('settingsLink')}
    </button>
  )
}
