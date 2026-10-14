import { describe, it, expect } from 'vitest'
import { SEO_JOBS, getAllSeoJobSlugs, getSeoJobBySlug, calculateJobKeywordMatch } from '@/data/seo-jobs'

describe('Programmatic SEO Engine', () => {
  it('contains comprehensive job datasets with localized slugs', () => {
    expect(SEO_JOBS.length).toBeGreaterThanOrEqual(4)
    const roSlugs = getAllSeoJobSlugs('ro')
    expect(roSlugs).toContain('inginer-software')
    expect(roSlugs).toContain('contabil')
    expect(roSlugs).toContain('manager-de-proiect')
  })

  it('retrieves job by slug accurately', () => {
    const job = getSeoJobBySlug('inginer-software', 'ro')
    expect(job).toBeDefined()
    expect(job?.title.ro).toBe('Inginer Software / Programator')
    expect(job?.keywords.hardSkills.ro.length).toBeGreaterThan(0)
    expect(job?.coverLetterSample.ro.intro).toBeDefined()
  })

  it('calculates job keyword matching percentage correctly', () => {
    const job = getSeoJobBySlug('inginer-software', 'ro')!
    const sampleResume = 'Experiență în TypeScript, React, Docker și Arhitectură microservicii.'

    const match = calculateJobKeywordMatch(sampleResume, job, 'ro')
    expect(match.foundKeywords.length).toBeGreaterThanOrEqual(2)
    expect(match.matchPercentage).toBeGreaterThan(0)
    expect(match.missingKeywords.length).toBeGreaterThan(0)
  })
})
