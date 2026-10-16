import { describe, it, expect } from 'vitest'
import sitemap from '@/app/sitemap'

describe('sitemap', () => {
  const entries = sitemap()
  const urls = entries.map((e) => e.url)

  it('drops the merged /cv pages and the removed /verificare-cv checker', () => {
    expect(urls.some((u) => u.includes('/cv/'))).toBe(false)
    expect(urls.some((u) => u.includes('verificare-cv'))).toBe(false)
    expect(urls).toContain('https://joben.eu/ro/free-ats-checker')
    expect(urls).toContain('https://joben.eu/en/scrisoare-intentie/software-engineer')
  })

  it('lists each guide under its own localized path and pairs them with hreflang', () => {
    expect(urls).toContain('https://joben.eu/ro/ghiduri/cv-citit-corect-de-ats')
    expect(urls).toContain('https://joben.eu/en/guides/cv-readable-by-ats')
    expect(urls.some((u) => u.includes('/en/ghiduri/'))).toBe(false)
    expect(urls.some((u) => u.includes('/ro/guides/'))).toBe(false)
    const ro = entries.find((e) => e.url === 'https://joben.eu/ro/ghiduri/cv-citit-corect-de-ats')
    expect(ro?.alternates?.languages?.en).toBe('https://joben.eu/en/guides/cv-readable-by-ats')
  })

  it('uses fixed lastModified dates and x-default alternates', () => {
    for (const entry of entries) {
      expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(entry.alternates?.languages?.['x-default']).toMatch(/^https:\/\/joben\.eu\/ro/)
    }
  })
})
