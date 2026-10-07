import { describe, expect, it } from 'vitest'
import { homeMarkdown, notFoundMarkdown, resolveMarkdownTarget, wantsMarkdown } from '@/lib/agent-markdown'
import { organizationJsonLd } from '@/lib/structured-data'

describe('wantsMarkdown', () => {
  it('prefers markdown only when ranked above html', () => {
    expect(wantsMarkdown('text/markdown')).toBe(true)
    expect(wantsMarkdown('text/markdown, text/html;q=0.8')).toBe(true)
    expect(wantsMarkdown('text/html,application/xhtml+xml,*/*;q=0.8')).toBe(false)
    expect(wantsMarkdown('text/markdown, */*')).toBe(true)
    expect(wantsMarkdown('text/markdown, text/html')).toBe(false)
    expect(wantsMarkdown('text/markdown;q=0')).toBe(false)
    expect(wantsMarkdown(null)).toBe(false)
  })
})

describe('resolveMarkdownTarget', () => {
  it('serves home markdown for / and locale roots', () => {
    expect(resolveMarkdownTarget('/')).toEqual({ kind: 'home', locale: 'ro' })
    expect(resolveMarkdownTarget('/en')).toEqual({ kind: 'home', locale: 'en' })
  })
  it('lets known pages fall through to HTML', () => {
    expect(resolveMarkdownTarget('/ro/pricing')).toBeNull()
    expect(resolveMarkdownTarget('/en/contact')).toBeNull()
  })
  it('flags unknown paths as not found', () => {
    expect(resolveMarkdownTarget('/__ora-404-probe')).toEqual({ kind: 'not-found' })
    expect(resolveMarkdownTarget('/ro/nope')).toEqual({ kind: 'not-found' })
  })
})

describe('markdown bodies', () => {
  it('home has an H1 and plans', () => {
    const md = homeMarkdown('en')
    expect(md.startsWith('# Joben')).toBe(true)
    expect(md).toContain('## FAQ')
  })
  it('404 body explains the error and links to llms.txt and sitemap', () => {
    const md = notFoundMarkdown()
    expect(md.length).toBeGreaterThan(20)
    expect(md).toContain('/llms.txt')
    expect(md).toContain('/sitemap.xml')
  })
})

describe('organizationJsonLd', () => {
  it('includes description, address and contactPoint', () => {
    const o = organizationJsonLd()
    expect(o.description.length).toBeGreaterThan(20)
    expect(o.address['@type']).toBe('PostalAddress')
    expect(o.contactPoint.email).toBeTruthy()
  })
})
