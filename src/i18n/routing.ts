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
  // Pages emit their own hreflang in <head> and the sitemap. The auto Link header assumed the
  // same path in every locale, so its x-default hit a 404 for localized slugs (glossary, guides).
  alternateLinks: false,
})

export type AppLocale = (typeof routing.locales)[number]
