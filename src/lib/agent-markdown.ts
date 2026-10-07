import { siteConfig } from '@/lib/content'
import messagesRo from '../../messages/ro.json'
import messagesEn from '../../messages/en.json'

const LOCALES = ['ro', 'en'] as const
export type MdLocale = (typeof LOCALES)[number]

// First path segment after the locale that maps to a real page. Anything else
// under a locale (or at the root) is a 404.
const KNOWN_SEGMENTS = new Set([
  'pricing', 'about', 'contact', 'privacy', 'terms', 'cookies', 'sign-in', 'sign-up',
  'resume-examples', 'free-ats-checker', 'dashboard', 'resumes', 'cover-letters',
  'ai-review', 'feedback', 'settings', 'sentry-example-page',
])

function qOf(accept: string, type: string): number | undefined {
  for (const part of accept.split(',')) {
    const [range, ...params] = part.trim().split(';').map((s) => s.trim())
    if (range.toLowerCase() !== type) continue
    const q = params.find((p) => p.startsWith('q='))
    const n = q ? Number(q.slice(2)) : 1
    return Number.isFinite(n) ? n : 0
  }
  return undefined
}

// True when the client ranks text/markdown strictly above HTML. Browsers
// (text/html first, */* fallback) and ties keep getting HTML.
export function wantsMarkdown(accept: string | null): boolean {
  if (!accept) return false
  const md = qOf(accept, 'text/markdown')
  if (!md) return false
  const html = qOf(accept, 'text/html')
  if (html !== undefined) return md > html
  // Explicit text/markdown beats a wildcard of equal weight.
  return md >= (qOf(accept, 'text/*') ?? qOf(accept, '*/*') ?? 0)
}

export type MdTarget = { kind: 'home'; locale: MdLocale } | { kind: 'not-found' } | null

// null = no markdown variant, serve the normal HTML response.
export function resolveMarkdownTarget(pathname: string): MdTarget {
  const segments = pathname.split('/').filter(Boolean)
  const locale = LOCALES.find((l) => l === segments[0])
  if (segments.length === 0) return { kind: 'home', locale: 'ro' }
  if (locale && segments.length === 1) return { kind: 'home', locale }
  const first = locale ? segments[1] : segments[0]
  return KNOWN_SEGMENTS.has(first) ? null : { kind: 'not-found' }
}

export function homeMarkdown(locale: MdLocale): string {
  const m = locale === 'en' ? messagesEn : messagesRo
  const plans = m.Pricing.plans
    .map((p) => `### ${p.name}: ${p.price}${p.pricePeriod}\n\n${p.description}\n\n${p.features.map((f) => `- ${f}`).join('\n')}`)
    .join('\n\n')
  const faq = m.Faq.map((i) => `### ${i.question}\n\n${i.answer}`).join('\n\n')
  const base = `${siteConfig.url}/${locale}`
  return `# ${siteConfig.name}

> ${m.Metadata.home.description}

## Pages

- [Pricing](${base}/pricing)
- [Free ATS checker](${base}/free-ats-checker)
- [Resume examples](${base}/resume-examples)
- [About](${base}/about)
- [Contact](${base}/contact)
- [Privacy](${base}/privacy)
- [llms.txt](${siteConfig.url}/llms.txt)

## Plans

${plans}

## FAQ

${faq}
`
}

export function notFoundMarkdown(): string {
  return `# Page not found

The page you requested does not exist on ${siteConfig.name}. It may have moved or the address may be mistyped.

Useful starting points:

- [Home](${siteConfig.url}/ro)
- [Sitemap](${siteConfig.url}/sitemap.xml)
- [llms.txt](${siteConfig.url}/llms.txt)
`
}
