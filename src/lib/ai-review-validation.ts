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

  // The model's overall/grade/status/worst_category often contradict its own
  // category scores (overall 72 over categories summing to 61). When all five
  // scores are present, derive the rest from them so the report is coherent.
  const categories = result.categories
  const keys = Object.keys(ANALYSIS_CATEGORY_MAX) as AnalysisCategoryKey[]
  if (isRecord(categories) && keys.every((key) => isRecord(categories[key]) && typeof categories[key].score === 'number')) {
    const scoreOf = (key: AnalysisCategoryKey) => (categories[key] as { score: number }).score
    const ratioOf = (key: AnalysisCategoryKey) => scoreOf(key) / ANALYSIS_CATEGORY_MAX[key]
    const derived: Record<string, unknown> = {}
    for (const key of keys) {
      const ratio = ratioOf(key)
      derived[key] = {
        ...(categories[key] as Record<string, unknown>),
        max: ANALYSIS_CATEGORY_MAX[key],
        status: ratio < 0.5 ? 'needs_work' : ratio < 0.8 ? 'ok' : 'good',
      }
    }
    result.categories = { ...categories, ...derived }
    result.overall_score = Math.round(keys.reduce((sum, key) => sum + scoreOf(key), 0))
    result.worst_category = keys.reduce((worst, key) => (ratioOf(key) < ratioOf(worst) ? key : worst))
    result.grade = analysisGrade(result.overall_score as number)
  }

  return result
}

function analysisGrade(score: number): string {
  if (score < 40) return 'Critical'
  if (score < 55) return 'Poor'
  if (score < 70) return 'Fair'
  if (score < 80) return 'Good'
  if (score < 90) return 'Excellent'
  return 'Outstanding'
}

const ATS_SCAN_CATEGORIES = ['ats_formatting', 'structure', 'keyword_impact', 'clarity'] as const
const ATS_SCAN_CATEGORY_MAX = 25

/**
 * Same idea for the free ATS scan: clamp each category to 0-25, then derive
 * overall_score and grade from them instead of trusting the model's totals.
 */
export function normalizeAtsScanScores<T>(result: T): T {
  if (!isRecord(result) || !isRecord(result.categories)) return result
  const categories = result.categories
  if (!ATS_SCAN_CATEGORIES.every((key) => isRecord(categories[key]) && typeof categories[key].score === 'number')) {
    return result
  }
  const clamped: Record<string, unknown> = { ...categories }
  let total = 0
  for (const key of ATS_SCAN_CATEGORIES) {
    const score = Math.round(Math.min(Math.max((categories[key] as { score: number }).score, 0), ATS_SCAN_CATEGORY_MAX))
    clamped[key] = { ...(categories[key] as Record<string, unknown>), score, max: ATS_SCAN_CATEGORY_MAX }
    total += score
  }
  const grade = total < 50 ? 'Poor' : total < 70 ? 'Fair' : total < 85 ? 'Good' : 'Excellent'
  return { ...result, categories: clamped, overall_score: total, grade } as T
}

function normalizeForMatch(text: string): string {
  // Keeps "node.js", "c++", "c#" intact; a sentence-ending dot is dropped.
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\.(?![\p{L}\p{N}])/gu, ' ')
    .replace(/[^\p{L}\p{N}+#.]+/gu, ' ')
    .trim()
}

function mentions(haystack: string, term: string): boolean {
  const needle = normalizeForMatch(term)
  return Boolean(needle) && ` ${haystack} `.includes(` ${needle} `)
}

// Share of the example's words (3+ letters) that occur in the resume. A real
// quote scores ~1; an example the model made up scores low.
function quoteOverlap(example: string, normalizedResume: string): number {
  const words = normalizeForMatch(example).split(' ').filter((word) => word.length > 2)
  if (words.length === 0) return 0
  const resumeWords = new Set(normalizedResume.split(' '))
  return words.filter((word) => resumeWords.has(word)).length / words.length
}

/**
 * Checks the model's claims about the resume against the actual text:
 * - keywords_found must literally occur in the resume;
 * - keywords_missing must occur in the job description and not in the resume
 *   (with no job description there is nothing to be "missing" against);
 * - an improvement's weak_example must be a (near) quote from the resume,
 *   otherwise it criticises text the candidate never wrote.
 */
export function verifyAnalysisAgainstSource(
  analysis: Record<string, unknown>,
  resumeText: string,
  jobDescription: string | undefined
): Record<string, unknown> {
  const resume = normalizeForMatch(resumeText)
  const jd = normalizeForMatch(jobDescription || '')
  const strings = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])

  return {
    ...analysis,
    job_match_mode: jd ? 'job_description' : 'general',
    keywords_found: strings(analysis.keywords_found).filter((keyword) => mentions(resume, keyword)),
    keywords_missing: jd
      ? strings(analysis.keywords_missing).filter((keyword) => mentions(jd, keyword) && !mentions(resume, keyword))
      : [],
    improvements: Array.isArray(analysis.improvements)
      ? analysis.improvements.filter((item) => {
          if (!isRecord(item) || typeof item.weak_example !== 'string') return true
          return quoteOverlap(item.weak_example, resume) >= 0.6
        })
      : analysis.improvements,
  }
}
