import { describe, expect, it, vi } from 'vitest'
import { clampAnalysisScores } from '@/lib/ai-review-validation'

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
