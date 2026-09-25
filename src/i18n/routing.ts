import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ro', 'en'],
  defaultLocale: 'ro',
  localePrefix: 'always',
  // Accept-Language-based redirect made `/` resolve to a different locale
  // per crawl, so Google couldn't settle on a stable canonical and indexed
  // the unprefixed root instead of /ro. Unprefixed paths now always resolve
  // to defaultLocale; LocaleSwitcher in Navbar covers manual /en access.
  localeDetection: false,
})

export type AppLocale = (typeof routing.locales)[number]
