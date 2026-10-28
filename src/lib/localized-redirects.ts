// Build-time 301s for URLs that used to resolve (or get guessed) but now 404:
// a slug under the other locale (/ro/resume-examples/data-analyst, the shared
// English slugs before 2026-09-18), and paths without a locale prefix (served
// as Romanian before 2026-09-19). Relative imports only: next.config.ts loads it.
import { resumeRoles } from '../data/resume-roles'
import { SEO_JOBS, coverLetterPath } from '../data/seo-jobs'
import { GUIDES, GUIDE_SEGMENT, guidePath } from '../data/guides'

type Pair = { ro: string; en: string }
type Redirect = { source: string; destination: string; statusCode: 301 }

export function localizedPairs(): Pair[] {
  const same = ['/pricing', '/about', '/contact', '/privacy', '/terms', '/cookies', '/resume-examples']
  return [
    ...same.map((p) => ({ ro: p, en: p })),
    { ro: '/verificare-cv-ats', en: '/free-ats-checker' },
    { ro: '/sabloane-cv', en: '/cv-templates' },
    ...Object.values(GUIDE_SEGMENT).map((s) => ({ ro: `/${s.ro}`, en: `/${s.en}` })),
    ...resumeRoles.map((r) => ({ ro: `/resume-examples/${r.slug.ro}`, en: `/resume-examples/${r.slug.en}` })),
    ...SEO_JOBS.map((j) => ({ ro: coverLetterPath('ro', j), en: coverLetterPath('en', j) })),
    ...GUIDES.map((g) => ({ ro: guidePath('ro', g), en: guidePath('en', g) })),
  ]
}

export function localizedRedirects(pairs = localizedPairs()): Redirect[] {
  const live = new Set(pairs.flatMap((p) => [`/ro${p.ro}`, `/en${p.en}`]))
  const out = new Map<string, string>()
  const add = (source: string, destination: string) => {
    if (source !== destination && !live.has(source) && !out.has(source)) out.set(source, destination)
  }
  for (const { ro, en } of pairs) {
    // Unprefixed paths were Romanian (defaultLocale); an English-only path goes to /en.
    add(ro, `/ro${ro}`)
    add(en, `/en${en}`)
    add(`/en${ro}`, `/en${en}`)
    add(`/ro${en}`, `/ro${ro}`)
  }
  return [...out].map(([source, destination]) => ({ source, destination, statusCode: 301 }))
}
