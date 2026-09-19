"use client"

import { useTranslations } from 'next-intl'
import { CheckCircle2, ArrowRight, Zap, Loader2 } from 'lucide-react'
import { AILoadingState } from '@/components/ui/AILoadingState'
import { buttonVariants } from '@/components/ui/Button'

type CategoryItem = {
  score?: number
  max?: number
  label?: string
  feedback?: string
  status?: 'needs_work' | 'ok' | 'good'
}

export type Improvement = {
  issue?: string
  weak_example?: string
  strong_example?: string
}

type AnalysisFeedback = {
  overall_score?: number
  grade?: string
  categories?: {
    ats_structure?: CategoryItem
    content_quality?: CategoryItem
    writing_quality?: CategoryItem
    job_match?: CategoryItem
    application_ready?: CategoryItem
  }
  strengths?: string[]
  improvements?: Improvement[]
}

export type AnalyzerReview = {
  id: string
  resume_id?: string | null
  score?: number | null
  feedback?: AnalysisFeedback
  resumes?: { title?: string } | Array<{ title?: string }> | null
}

function getResumeTitle(value: AnalyzerReview['resumes'], fallback: string) {
  if (!value) return fallback
  if (Array.isArray(value)) return value[0]?.title || fallback
  return value.title || fallback
}

type ResumeAnalyzerProps = {
  review: AnalyzerReview | null
  comparison?: {
    previousScore: number | null
    previousReviewId: string | null
    delta: number | null
  } | null
  isLoading?: boolean
  error?: string
  onApplyFix?: (improvementIndex: number) => void | Promise<void>
  onAutoFix?: () => void | Promise<void>
  canApplyFixes?: boolean
  isSavingAutoFix?: boolean
  autoFixError?: string
  loadingImprovementIndex?: number | null
  fixErrors?: Record<number, string>
}

export function ResumeAnalyzer({
  review,
  comparison = null,
  isLoading = false,
  error = '',
  onApplyFix,
  onAutoFix,
  canApplyFixes = false,
  isSavingAutoFix = false,
  autoFixError = '',
  loadingImprovementIndex = null,
  fixErrors = {},
}: ResumeAnalyzerProps) {
  const t = useTranslations('AiReviewPage.analyzer')
  const tScore = useTranslations('Dashboard.scoreBreakdown')

  if (isLoading) {
    return (
      <div className="border border-(--border) p-10 text-center">
        <AILoadingState stage="generating" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-l-2 border-(--foreground) p-10 text-(--foreground)">
        {error}
      </div>
    )
  }

  if (!review) {
    return (
      <div className="border border-(--border) p-10 text-center text-(--muted)">
        {t('noReviewData')}
      </div>
    )
  }

  const feedback = review.feedback || {}
  const overallScore = Number(feedback.overall_score ?? review.score ?? 0)
  const grade = feedback.grade || t('unknownGrade')
  const categories = [
    feedback.categories?.ats_structure,
    feedback.categories?.content_quality,
    feedback.categories?.writing_quality,
    feedback.categories?.job_match,
    feedback.categories?.application_ready,
  ].filter(Boolean) as CategoryItem[]

  const improvements = feedback.improvements || []
  const strengths = feedback.strengths || []

  const anyFixLoading = loadingImprovementIndex !== null || isSavingAutoFix

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left panel */}
      <div className="lg:col-span-1 space-y-8">
        <div className="border border-(--border) p-8">
          <h3 className="font-mono text-(length:--text-label) text-(--muted)">{t('overallMatchScore')}</h3>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-(length:--text-score) font-bold leading-none tabular-nums text-(--foreground)">{overallScore}</span>
            <span className="font-mono text-lg text-(--muted)">/100</span>
          </div>
          <div className="mt-4 h-1 w-full bg-(--border)">
            <div className="h-full bg-(--accent)" style={{ width: `${Math.max(0, Math.min(100, overallScore))}%` }} />
          </div>

          <p className="mt-6 text-(--foreground) font-bold text-xl">{grade}</p>
          <p className="mt-1 text-sm text-(--muted)">{t('reviewFor', { title: getResumeTitle(review.resumes, t('resumeFallback')) })}</p>

          {comparison ? (
            <div className="mt-6 border-t border-(--border) pt-4">
              <p className="font-mono text-(length:--text-label) text-(--muted)">{t('vsPreviousReview')}</p>
              {comparison.delta === null ? (
                <p className="mt-1 text-sm text-(--muted)">{t('firstReviewForResume')}</p>
              ) : (
                <p className="mt-1 text-sm font-semibold tabular-nums text-(--foreground)">
                  {comparison.delta >= 0 ? '+' : ''}{comparison.delta} {t('pts')}
                  <span className="ml-2 text-xs font-normal text-(--muted)">
                    ({t('prevScore', { score: comparison.previousScore ?? 0 })})
                  </span>
                </p>
              )}
            </div>
          ) : null}

          {/* Auto Fix button */}
          <div className="mt-8">
            {isSavingAutoFix ? (
              <AILoadingState stage="saving" />
            ) : (
              <button
                onClick={() => void onAutoFix?.()}
                disabled={!canApplyFixes || anyFixLoading}
                className={`w-full flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants('primary', 'md')}`}
              >
                <Zap className="w-5 h-5 fill-current" /> {t('autoFixAll')}
              </button>
            )}
            {autoFixError ? (
              <p className="mt-2 border-l-2 border-(--foreground) pl-2 text-xs text-(--foreground)">{autoFixError}</p>
            ) : null}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="border border-(--border) p-6">
          <h3 className="text-(--foreground) font-bold mb-4">{tScore('title')}</h3>
          <div className="space-y-4">
            {categories.map((item, idx) => {
              const score = Number(item.score || 0)
              const max = Number(item.max || 100)
              const width = Math.max(0, Math.min(100, Math.round((score / max) * 100)))
              return (
                <div key={`${item.label || 'cat'}-${idx}`}>
                  <div className="flex justify-between gap-3 text-sm mb-1.5">
                    <span className="text-(--muted)">{item.label || t('categoryFallback')}</span>
                    <span className="text-(--foreground) font-mono tabular-nums">{score}/{max}</span>
                  </div>
                  <div className="h-1 w-full bg-(--border)">
                    <div className="h-1 bg-(--accent)" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-2 space-y-8">
        <div className="border border-(--border) p-8">
          <h2 className="text-2xl font-bold text-(--foreground) mb-6 border-b border-(--border) pb-4">{t('actionableFeedback')}</h2>

          {/* Priority Improvements: index + 2px black rule, per the brief */}
          <div className="mb-8">
            <h3 className="font-mono text-(length:--text-label) text-(--muted) mb-4">{t('priorityImprovements')}</h3>
            {improvements.length === 0 ? (
              <div className="border border-(--border) p-4 text-sm text-(--muted)">
                {t('noImprovementSuggestions')}
              </div>
            ) : (
              <div className="divide-y divide-(--border) border-t border-(--border)">
                {improvements.map((imp, idx) => {
                  const isThisLoading = loadingImprovementIndex === idx
                  const thisError = fixErrors[idx]

                  return (
                    <div
                      key={`${imp.issue || 'issue'}-${idx}`}
                      className="flex gap-4 border-l-2 border-(--foreground) py-5 pl-4"
                    >
                      <span className="font-mono text-sm text-(--muted) shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="flex-1 space-y-3">
                        <p className="text-sm text-(--foreground)">{imp.issue || t('defaultIssue')}</p>
                        <div>
                          <p className="font-mono text-(length:--text-label) text-(--muted) mb-1.5">{t('current')}</p>
                          <p className="text-sm text-(--muted) border border-(--border) px-3 py-2">
                            {imp.weak_example || t('notAvailable')}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-(length:--text-label) text-(--muted) mb-1.5">{t('suggested')}</p>
                          <p className="text-sm text-(--foreground) bg-(--accent-muted) px-3 py-2">
                            {imp.strong_example || t('notAvailable')}
                          </p>
                        </div>

                        <div className="pt-1">
                          {isThisLoading ? (
                            <span className="inline-flex items-center gap-2 text-sm text-(--muted)">
                              <Loader2 className="w-4 h-4 animate-spin" /> {t('applyingFix')}
                            </span>
                          ) : (
                            <>
                              {thisError ? (
                                <p className="text-xs text-(--foreground) mb-2">{thisError}</p>
                              ) : null}
                              {onApplyFix ? (
                                <button
                                  onClick={() => void onApplyFix(idx)}
                                  disabled={anyFixLoading}
                                  className="text-(--foreground) text-sm font-medium hover:text-(--muted) flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-out"
                                >
                                  {t('applyThisFix')} <ArrowRight className="w-4 h-4" />
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Strengths */}
          <div>
            <h3 className="font-mono text-(length:--text-label) text-(--muted) mb-4">{t('strengths')}</h3>
            <div className="border border-(--border) p-4">
              {strengths.length === 0 ? (
                <p className="text-sm text-(--muted)">{t('noStrengthsReturned')}</p>
              ) : (
                <ul className="space-y-3 text-sm text-(--muted)">
                  {strengths.map((s, idx) => (
                    <li key={`${s}-${idx}`} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-(--foreground) shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Category Insights */}
          {categories.some((c) => c.feedback) ? (
            <div className="mt-8">
              <h3 className="font-mono text-(length:--text-label) text-(--muted) mb-4">{t('categoryInsights')}</h3>
              <div className="divide-y divide-(--border) border-t border-(--border)">
                {categories.map((c, idx) =>
                  c.feedback ? (
                    <div key={`${c.label || 'insight'}-${idx}`} className="py-4">
                      <p className="text-(--foreground) font-medium mb-1">{c.label || t('categoryFallback')}</p>
                      <p className="text-sm text-(--muted)">{c.feedback}</p>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
