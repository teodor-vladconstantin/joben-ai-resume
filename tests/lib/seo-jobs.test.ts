import { describe, it, expect } from 'vitest'
import {
  SEO_JOBS,
  getAllSeoJobSlugs,
  getSeoJobBySlug,
  getSeoJobForResumeRole,
  calculateJobKeywordMatch,
} from '@/data/seo-jobs'
import { resumeRoles } from '@/data/resume-roles'

const ENGLISH_SWE_RESUME = `
Jane Doe | Senior Software Engineer | github.com/janedoe | linkedin.com/in/janedoe

EXPERIENCE
Acme Payments, Senior Software Engineer (2021 to present)
- Redesigned the checkout service in TypeScript and Node.js on PostgreSQL, cutting p95 latency from 850ms to 190ms.
- Built CI/CD pipelines with GitHub Actions and Docker; deployments run on Kubernetes in AWS.
- Mentoring junior engineers through code review and pairing; agile ceremonies every sprint.
- Exposed partner integrations through GraphQL and REST endpoints.

SKILLS
React, Next.js, Git, automated testing (TDD), database optimization
`

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
    expect(job?.title.ro).toBe('Inginer Software')
    expect(job?.keywords.hardSkills.ro.length).toBeGreaterThan(0)
    expect(job?.coverLetterSample.ro.intro).toBeDefined()
  })

  it('maps every job to an existing resume-examples role (the /cv redirect targets)', () => {
    for (const job of SEO_JOBS) {
      const role = resumeRoles.find((r) => r.slug.en === job.resumeRoleSlug.en)
      expect(role, job.slug.en).toBeDefined()
      expect(role?.slug.ro).toBe(job.resumeRoleSlug.ro)
      expect(getSeoJobForResumeRole(job.resumeRoleSlug.en)).toBe(job)
    }
  })

  it('keeps hard/soft skill arrays parallel across locales', () => {
    for (const job of SEO_JOBS) {
      expect(job.keywords.hardSkills.ro.length).toBe(job.keywords.hardSkills.en.length)
      expect(job.keywords.softSkills.ro.length).toBe(job.keywords.softSkills.en.length)
    }
  })

  it('ships full cover letter samples without trailing ellipses', () => {
    for (const job of SEO_JOBS) {
      for (const sample of [job.coverLetterSample.ro, job.coverLetterSample.en]) {
        for (const part of [sample.intro, sample.body, sample.closing]) {
          expect(part.trim().endsWith('...')).toBe(false)
          expect(part).not.toMatch(/[–—]/)
        }
      }
    }
  })
})

describe('calculateJobKeywordMatch', () => {
  const job = getSeoJobBySlug('inginer-software', 'ro')!

  it('matches same-locale keywords case-insensitively', () => {
    const match = calculateJobKeywordMatch('Experiență în TYPESCRIPT, React, Docker și arhitectură microservicii.', job, 'ro')
    expect(match.foundKeywords).toEqual(expect.arrayContaining(['TypeScript', 'React', 'Docker', 'Arhitectură microservicii']))
    expect(match.matchPercentage).toBeGreaterThan(0)
    expect(match.missingKeywords.length).toBeGreaterThan(0)
  })

  it('credits an English resume against the Romanian keyword list via the parallel en keyword', () => {
    const match = calculateJobKeywordMatch(ENGLISH_SWE_RESUME, job, 'ro')
    expect(match.foundKeywords).toEqual(
      expect.arrayContaining([
        'Mentorat colegi juniori', // via "Mentoring junior engineers"
        'Testare automată (TDD)', // via "Automated testing (TDD)"
        'Optimizare baze de date', // via "Database optimization"
        'CI/CD pipeline', // full keyword
        'RESTful APIs / GraphQL', // via the "GraphQL" alternative
        'Metodologii Agile / Scrum', // via the "Agile" alternative of the en keyword
        'AWS / GCP', // tool alternative
        'Node.js',
        'PostgreSQL',
        'Kubernetes',
      ])
    )
    expect(match.missingKeywords).toEqual(expect.arrayContaining(['Securitate web (OWASP)', 'Python']))
    expect(match.foundKeywords.length + match.missingKeywords.length).toBe(
      job.keywords.hardSkills.ro.length + job.keywords.softSkills.ro.length + job.keywords.tools.length
    )
  })

  it('reports keywords in the requested locale', () => {
    const match = calculateJobKeywordMatch(ENGLISH_SWE_RESUME, job, 'en')
    expect(match.foundKeywords).toContain('Mentoring junior engineers')
    expect(match.foundKeywords).not.toContain('Mentorat colegi juniori')
  })

  it('ignores slash fragments too short to be meaningful', () => {
    // "CI" from "CI/CD" and "CO" from "SAP FI/CO" would otherwise match any text.
    const match = calculateJobKeywordMatch('Specific circumstances, company code, coordination.', job, 'ro')
    expect(match.foundKeywords).not.toContain('CI/CD pipeline')
    const accountant = getSeoJobBySlug('contabil', 'ro')!
    expect(calculateJobKeywordMatch('company coordination', accountant, 'ro').foundKeywords).not.toContain('SAP FI/CO')
    expect(calculateJobKeywordMatch('Lucrez în SAP FI zilnic.', accountant, 'ro').foundKeywords).toContain('SAP FI/CO')
  })
})
