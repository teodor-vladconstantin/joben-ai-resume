import { describe, expect, it, vi } from 'vitest'
import { clampAnalysisScores, normalizeAtsScanScores, verifyAnalysisAgainstSource } from '@/lib/ai-review-validation'

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

const context = { requestId: 'req-1', userId: 'user-1' }

type CategoryScores = Record<string, { score: unknown; feedback?: string }>

function categoriesOf(result: Record<string, unknown>): CategoryScores {
  return result.categories as CategoryScores
}

describe('clampAnalysisScores', () => {
  it('leaves in-range scores untouched', () => {
    const analysis = {
      overall_score: 76,
      categories: {
        ats_structure: { score: 18, max: 20 },
        content_quality: { score: 32, max: 40 },
      },
    }

    const result = clampAnalysisScores(analysis, context)

    expect(result.overall_score).toBe(76)
    expect(categoriesOf(result).ats_structure.score).toBe(18)
    expect(categoriesOf(result).content_quality.score).toBe(32)
  })

  it('clamps a category score above its max down to the max', () => {
    const analysis = {
      overall_score: 87,
      categories: {
        ats_structure: { score: 23, max: 20 },
      },
    }

    const result = clampAnalysisScores(analysis, context)

    expect(categoriesOf(result).ats_structure.score).toBe(20)
  })

  it('clamps a negative category score up to zero', () => {
    const analysis = {
      overall_score: 50,
      categories: {
        writing_quality: { score: -3, max: 10 },
      },
    }

    const result = clampAnalysisScores(analysis, context)

    expect(categoriesOf(result).writing_quality.score).toBe(0)
  })

  it('clamps overall_score into 0-100 without rejecting the review', () => {
    const analysis = { overall_score: 142, categories: {} }

    const result = clampAnalysisScores(analysis, context)

    expect(result.overall_score).toBe(100)
    expect(result).toHaveProperty('categories')
  })

  it('defaults a missing/non-numeric overall_score to 0', () => {
    const result = clampAnalysisScores({ overall_score: 'not-a-number', categories: {} }, context)
    expect(result.overall_score).toBe(0)
  })

  it('ignores non-numeric category scores instead of throwing', () => {
    const analysis = {
      overall_score: 60,
      categories: { job_match: { score: 'high', max: 25 } },
    }

    const result = clampAnalysisScores(analysis, context)

    expect(categoriesOf(result).job_match.score).toBe('high')
  })

  it('returns an empty object for non-object input', () => {
    expect(clampAnalysisScores(null, context)).toEqual({})
    expect(clampAnalysisScores('garbage', context)).toEqual({})
    expect(clampAnalysisScores([1, 2, 3], context)).toEqual({})
  })

  it('preserves all other analysis fields untouched', () => {
    const analysis = {
      overall_score: 87,
      grade: 'Excellent',
      strengths: ['a', 'b', 'c'],
      categories: { ats_structure: { score: 23, max: 20, feedback: 'Good structure' } },
    }

    const result = clampAnalysisScores(analysis, context)

    expect(result.grade).toBe('Excellent')
    expect(result.strengths).toEqual(['a', 'b', 'c'])
    expect(categoriesOf(result).ats_structure.feedback).toBe('Good structure')
  })
})

describe('derived analysis totals', () => {
  it('derives overall, grade, status and worst category from the five category scores', () => {
    const result = clampAnalysisScores(
      {
        overall_score: 90,
        grade: 'Outstanding',
        worst_category: 'content_quality',
        categories: {
          ats_structure: { score: 16, max: 20, status: 'needs_work' },
          content_quality: { score: 30, max: 40 },
          writing_quality: { score: 8, max: 10 },
          job_match: { score: 5, max: 25 },
          application_ready: { score: 4, max: 5 },
        },
      },
      context
    )
    expect(result.overall_score).toBe(63)
    expect(result.grade).toBe('Fair')
    expect(result.worst_category).toBe('job_match')
    expect(categoriesOf(result).ats_structure).toMatchObject({ score: 16, status: 'good' })
  })

  it('normalizes the free ATS scan the same way', () => {
    const result = normalizeAtsScanScores({
      overall_score: 95,
      grade: 'Excellent',
      categories: {
        ats_formatting: { score: 30, max: 25 },
        structure: { score: 20, max: 25 },
        keyword_impact: { score: 10.4, max: 25 },
        clarity: { score: -2, max: 25 },
      },
      issues: [],
    })
    expect(result.overall_score).toBe(55)
    expect(result.grade).toBe('Fair')
    expect(result.categories.ats_formatting.score).toBe(25)
  })
})

describe('verifyAnalysisAgainstSource', () => {
  const resume = 'Built REST APIs in Node.js and PostgreSQL. Managed a team of five engineers.'

  it('drops keywords and weak examples the resume does not contain', () => {
    const result = verifyAnalysisAgainstSource(
      {
        keywords_found: ['Node.js', 'Kubernetes', 'postgresql'],
        keywords_missing: ['Kubernetes', 'PostgreSQL', 'Terraform'],
        improvements: [
          { issue: 'Vague', weak_example: 'Managed a team of five engineers', strong_example: 'x' },
          { issue: 'Invented', weak_example: 'Responsible for sales pipeline in EMEA', strong_example: 'y' },
        ],
      },
      resume,
      'We need Kubernetes and PostgreSQL experience.'
    )
    expect(result.keywords_found).toEqual(['Node.js', 'postgresql'])
    expect(result.keywords_missing).toEqual(['Kubernetes'])
    expect(result.improvements).toHaveLength(1)
    expect(result.job_match_mode).toBe('job_description')
  })

  it('returns no missing keywords without a job description', () => {
    const result = verifyAnalysisAgainstSource({ keywords_missing: ['Docker'] }, resume, '')
    expect(result.keywords_missing).toEqual([])
    expect(result.job_match_mode).toBe('general')
  })
})
