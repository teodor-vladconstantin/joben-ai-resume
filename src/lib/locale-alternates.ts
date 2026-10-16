import { routing } from '@/i18n/routing'

// Canonical + hreflang (self-referencing, reciprocal, with x-default) for a
// page that shares the same path under every locale. `path` is '' for home.
export function localeAlternates(locale: string, path = '') {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}${path}`]),
  )
  languages['x-default'] = `/${routing.defaultLocale}${path}`
  return { canonical: `/${locale}${path}`, languages }
}
