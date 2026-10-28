import { describe, it, expect } from 'vitest'
import sitemap from '@/app/sitemap'
import { localizedPairs, localizedRedirects } from '@/lib/localized-redirects'

describe('localized redirects', () => {
  const redirects = localizedRedirects()
  const to = (source: string) => redirects.find((r) => r.source === source)?.destination
  const sitemapPaths = sitemap().map((e) => new URL(e.url).pathname)

  it('covers exactly the sitemap pages (no drift)', () => {
    const pairPaths = localizedPairs().flatMap((p) => [`/ro${p.ro}`, `/en${p.en}`])
    const home = ['/ro', '/en']
    expect(new Set([...pairPaths, ...home])).toEqual(new Set(sitemapPaths.map((p) => p.replace(/\/$/, '') || '/')))
  })

  it('stays well under the 2048-route limit of Vercel', () => {
    expect(redirects.length).toBeLessThan(1500)
  })

  it('never redirects a live page', () => {
    const live = new Set(sitemapPaths)
    expect(redirects.filter((r) => live.has(r.source))).toEqual([])
  })

  it('sends wrong-locale and unprefixed slugs to the real page', () => {
    expect(to('/ro/resume-examples/data-analyst')).toBe('/ro/resume-examples/analist-date')
    expect(to('/en/resume-examples/analist-date')).toBe('/en/resume-examples/data-analyst')
    expect(to('/en/sabloane-cv')).toBe('/en/cv-templates')
    expect(to('/pricing')).toBe('/ro/pricing')
    expect(to('/cv-templates')).toBe('/en/cv-templates')
  })
})
