import { describe, expect, it } from 'vitest'
import { isAppPath } from '@/lib/app-origin'

describe('isAppPath', () => {
  it('matches account pages with or without locale, sub-paths and query', () => {
    for (const p of ['/dashboard', '/ro/dashboard', '/en/resumes/new', '/sign-up?from=ats', '/ro/sign-in/factor-one', '/cover-letters/1']) {
      expect(isAppPath(p), p).toBe(true)
    }
  })

  it('leaves marketing pages and lookalike prefixes on the main site', () => {
    for (const p of ['/', '/ro', '/ro/pricing', '/free-ats-checker', '/ro/resume-examples/x', '/ro/cover-letter/x', '/dashboards', '/ro/resumes-guide']) {
      expect(isAppPath(p), p).toBe(false)
    }
  })
})
