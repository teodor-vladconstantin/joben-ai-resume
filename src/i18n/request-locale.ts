import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing, type AppLocale } from './routing'

/**
 * Validates the `[locale]` route param and registers it with next-intl.
 *
 * Pages render in parallel with `[locale]/layout.tsx`, so the layout's own
 * `hasLocale` check and `setRequestLocale` call do not protect them. Without
 * this, an unknown path such as `/api/cookies` (unlocalized in proxy.ts, so
 * next-intl middleware skips it) matches `[locale]=api`, and next-intl falls
 * back to reading `headers()` to resolve the locale, which breaks static
 * rendering ("Page changed from static to dynamic at runtime").
 */
export function enableRequestLocale(locale: string): AppLocale {
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)
  return locale
}
