import { describe, it, expect } from 'vitest'
import sitemap from '@/app/sitemap'
import { fallbackLocalePath } from '@/lib/locale-switch'
import type { AppLocale } from '@/i18n/routing'

const ORIGIN = 'https://joben.eu'
const entries = sitemap()
// The sitemap lists exactly the pages that answer 200.
const live = new Set(entries.map((e) => new URL(e.url).pathname))
const other = (l: AppLocale): AppLocale => (l === 'ro' ? 'en' : 'ro')
const localeOf = (path: string) => path.split('/')[1] as AppLocale
const strip = (path: string) => path.replace(/^\/(ro|en)/, '') || '/'

describe('fallbackLocalePath', () => {
  it('maps hubs and localized sections', () => {
    expect(fallbackLocalePath('/ghiduri', 'ro', 'en')).toBe('/guides')
    expect(fallbackLocalePath('/guides/x', 'en', 'ro')).toBe('/ghiduri')
    expect(fallbackLocalePath('/sabloane-cv', 'ro', 'en')).toBe('/cv-templates')
    expect(fallbackLocalePath('/free-ats-checker', 'en', 'ro')).toBe('/verificare-cv-ats')
  })

  it('goes home when the section has no hub, and leaves shared pages alone', () => {
    expect(fallbackLocalePath('/scrisoare-intentie/inginer-software', 'ro', 'en')).toBe('/')
    expect(fallbackLocalePath('/pricing', 'ro', 'en')).toBe('/pricing')
    expect(fallbackLocalePath('/', 'ro', 'en')).toBe('/')
    expect(fallbackLocalePath('/dashboard', 'en', 'ro')).toBe('/dashboard')
  })
})

describe('every sitemap page', () => {
  it('has a language counterpart that exists, and the fallback never 404s', () => {
    for (const entry of entries) {
      const path = new URL(entry.url).pathname
      const from = localeOf(path)
      const to = other(from)

      const alt = entry.alternates?.languages?.[to]
      if (alt) {
        expect(live.has(new URL(alt).pathname), `${path} -> ${alt}`).toBe(true)
        // reciprocal: the counterpart points back
        const back = entries.find((e) => e.url === alt)?.alternates?.languages?.[from]
        expect(back, `${alt} should point back to ${entry.url}`).toBe(entry.url)
      }

      const target = `/${to}${fallbackLocalePath(strip(path), from, to)}`.replace(/\/$/, '')
      expect(live.has(target), `fallback ${path} -> ${target}`).toBe(true)
    }
  })

  it('covers the locale pairs that used to 404', () => {
    const url = `${ORIGIN}/ro/ghiduri/cv-dupa-o-pauza-in-cariera`
    const entry = entries.find((e) => e.url === url)
    expect(entry?.alternates?.languages?.en).toBe(`${ORIGIN}/en/guides/resume-after-a-career-gap`)
  })
})
