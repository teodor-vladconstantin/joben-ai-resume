import { logger } from '@/lib/logger'

export const ANALYSIS_CATEGORY_MAX = {
  ats_structure: 20,
  content_quality: 40,
  writing_quality: 10,
  job_match: 25,
  application_ready: 5,
} as const

export type AnalysisCategoryKey = keyof typeof ANALYSIS_CATEGORY_MAX

type ClampLogContext = {
  requestId: string
  userId: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Claude is instructed to score each category within its stated max and
 * overall_score within 0-100, but nothing enforces that server-side before
 * this. Clamps out-of-range values (logging when it happens) rather than
 * rejecting the review, since a single overshoot category doesn't
 * invalidate the rest of a paid analysis call.
 */
export function clampAnalysisScores(analysis: unknown, context: ClampLogContext): Record<string, unknown> {
  if (!isRecord(analysis)) return {}

  const result: Record<string, unknown> = { ...analysis }

  const rawCategories = analysis.categories
  if (isRecord(rawCategories)) {
    const clampedCategories: Record<string, unknown> = { ...rawCategories }

    for (const key of Object.keys(ANALYSIS_CATEGORY_MAX) as AnalysisCategoryKey[]) {
      const category = rawCategories[key]
      if (!isRecord(category)) continue

      const rawScore = category.score
      if (typeof rawScore !== 'number' || Number.isNaN(rawScore)) continue

      const max = ANALYSIS_CATEGORY_MAX[key]
      const clampedScore = Math.min(Math.max(rawScore, 0), max)

      if (clampedScore !== rawScore) {
        logger.warn('AI review category score out of range, clamped', {
          requestId: context.requestId,
          userId: context.userId,
          category: key,
          rawScore,
          max,
          clampedScore,
        })
        clampedCategories[key] = { ...category, score: clampedScore }
      }
    }

    result.categories = clampedCategories
  }

  const rawOverall = analysis.overall_score
  const overallScore = typeof rawOverall === 'number' && !Number.isNaN(rawOverall) ? rawOverall : 0
  const clampedOverall = Math.min(Math.max(overallScore, 0), 100)

  if (clampedOverall !== overallScore) {
    logger.warn('AI review overall_score out of range, clamped', {
      requestId: context.requestId,
      userId: context.userId,
      rawScore: overallScore,
      clampedScore: clampedOverall,
    })
  }

  result.overall_score = clampedOverall

  return result
}
