import type { AppLocale } from '@/i18n/routing'

// Sections whose URL segment differs per locale (or that exist under one locale
// only). `hub` = a listing page exists at the section root. Keep in sync with the
// route folders under src/app/[locale]; tests/lib/locale-switch.test.ts checks it
// against the sitemap.
const SECTIONS: { ro: string; en: string; hub: boolean }[] = [
  { ro: 'ghiduri', en: 'guides', hub: true },
  { ro: 'glosar', en: 'glossary', hub: true },
  { ro: 'comparatii', en: 'compare', hub: true },
  { ro: 'resume-examples', en: 'resume-examples', hub: true },
  { ro: 'scrisoare-intentie', en: 'cover-letter', hub: false },
  { ro: 'sabloane-cv', en: 'cv-templates', hub: true },
  { ro: 'verificare-cv-ats', en: 'free-ats-checker', hub: true },
]

/**
 * Safe target for the language switch when the exact counterpart is unknown
 * (server render, no JS, page without hreflang). Never a 404: the same path for
 * pages shared by both locales, the section hub for localized sections, the
 * home page when the section has no hub. `pathname` has no locale prefix.
 */
export function fallbackLocalePath(pathname: string, from: AppLocale, to: AppLocale): string {
  const [, segment = '', ...rest] = pathname.split('/')
  const section = SECTIONS.find((s) => s[from] === segment)
  if (!section) return pathname
  if (rest.length === 0) return `/${section[to]}`
  return section.hub ? `/${section[to]}` : '/'
}

/**
 * The exact counterpart of the current page, read from the hreflang link the
 * page itself declares (the same data Google sees), as a locale-less path.
 * Null when the page declares no alternate for `to`.
 */
export function alternatePathFromHead(doc: Document, to: AppLocale): string | null {
  const href = doc.head.querySelector(`link[rel="alternate"][hreflang="${to}"]`)?.getAttribute('href')
  if (!href) return null
  const { pathname } = new URL(href, doc.location.href)
  if (pathname === `/${to}`) return '/'
  return pathname.startsWith(`/${to}/`) ? pathname.slice(to.length + 1) : null
}
