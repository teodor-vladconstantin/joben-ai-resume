"use client"

import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Zap, Loader2 } from 'lucide-react'
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

function getResumeTitle(value: AnalyzerReview['resumes']) {
  if (!value) return 'Resume'
  if (Array.isArray(value)) return value[0]?.title || 'Resume'
  return value.title || 'Resume'
}

/** Hex color keyed to 0-100 score — used for ring, text, borders. A genuine
 * 4-tier semantic system (excellent/good/fair/poor), not a static dark-theme
 * surface color, so it is intentionally NOT tokenized -- see Global
 * Constraints in the plan for why. */
function scoreColor(score: number): string {
  if (score >= 85) return '#16DB65'  // Excellent / Outstanding
  if (score >= 70) return '#84CC16'  // Good
  if (score >= 50) return '#F97316'  // Fair
  return '#EF4444'                   // Poor / Critical
}

/** Hex color for category progress bars based on fraction achieved. */
function categoryColor(score: number, max: number): string {
  return scoreColor(max > 0 ? Math.round((score / max) * 100) : 0)
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
  if (isLoading) {
    return (
      <div className="bg-(--surface) rounded-2xl border border-(--border) p-10 text-center">
        <AILoadingState stage="generating" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-(--surface) rounded-2xl border border-red-400/30 p-10 text-center text-red-400">
        {error}
      </div>
    )
  }

  if (!review) {
    return (
      <div className="bg-(--surface) rounded-2xl border border-(--border) p-10 text-center text-(--muted)">
        No review data available.
      </div>
    )
  }

  const feedback = review.feedback || {}
  const overallScore = Number(feedback.overall_score ?? review.score ?? 0)
  const grade = feedback.grade || 'Unknown'
  const categories = [
    feedback.categories?.ats_structure,
    feedback.categories?.content_quality,
    feedback.categories?.writing_quality,
    feedback.categories?.job_match,
    feedback.categories?.application_ready,
  ].filter(Boolean) as CategoryItem[]

  const improvements = feedback.improvements || []
  const strengths = feedback.strengths || []
  const ringColor = scoreColor(overallScore)

  const anyFixLoading = loadingImprovementIndex !== null || isSavingAutoFix

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-(--surface) rounded-3xl border border-(--border) p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-(--accent-muted) rounded-bl-[100px] pointer-events-none" />
          <h3 className="text-(--muted) font-medium mb-4 uppercase tracking-wider text-sm">Overall Match Score</h3>

          <div className="relative w-40 h-40 mx-auto flex items-center justify-center rounded-full border-12 border-(--border) mb-6">
            <div
              className="absolute inset-0 border-12 rounded-full border-l-transparent border-b-transparent transform rotate-45"
              style={{ borderColor: ringColor }}
            />
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-(--foreground)">{overallScore}</span>
              <span className="font-bold text-sm" style={{ color: ringColor }}>/ 100</span>
            </div>
          </div>

          <p className="text-(--foreground) font-bold text-xl mb-2">{grade}</p>
          <p className="text-sm text-(--muted)">Review for {getResumeTitle(review.resumes)}.</p>

          {comparison ? (
            <div className="mt-4 rounded-xl border border-(--border) bg-(--background) px-4 py-3 text-left">
              <p className="text-xs uppercase tracking-wide text-(--muted)">vs previous review</p>
              {comparison.delta === null ? (
                <p className="mt-1 text-sm text-(--muted)">First review for this resume.</p>
              ) : (
                <p className={`mt-1 text-sm font-semibold ${comparison.delta >= 0 ? 'text-(--accent-strong)' : 'text-red-400'}`}>
                  {comparison.delta >= 0 ? '+' : ''}{comparison.delta} pts
                  <span className="ml-2 text-xs font-normal text-(--muted)">
                    (prev: {comparison.previousScore ?? 0})
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
                <Zap className="w-5 h-5 fill-current" /> Auto-Fix All
              </button>
            )}
            {autoFixError ? (
              <p className="mt-2 text-xs text-red-400">{autoFixError}</p>
            ) : null}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="bg-(--surface) rounded-2xl border border-(--border) p-6">
          <h3 className="text-(--foreground) font-bold mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            {categories.map((item, idx) => {
              const score = Number(item.score || 0)
              const max = Number(item.max || 100)
              const width = Math.max(0, Math.min(100, Math.round((score / max) * 100)))
              return (
                <div key={`${item.label || 'cat'}-${idx}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-(--muted)">{item.label || 'Category'}</span>
                    <span className="text-(--foreground) font-bold">{score}/{max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-(--background) rounded-full">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${width}%`, backgroundColor: categoryColor(score, max) }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-(--surface) rounded-3xl border border-(--border) p-8">
          <h2 className="text-2xl font-bold text-(--foreground) mb-6 border-b border-(--border) pb-4">Actionable Feedback</h2>

          {/* Priority Improvements */}
          <div className="mb-8">
            <h3 className="text-red-400 font-bold flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5" /> Priority Improvements
            </h3>
            <div className="space-y-4">
              {improvements.length === 0 ? (
                <div className="bg-(--surface) rounded-xl border border-(--accent-strong)/20 p-4 text-sm text-(--muted)">
                  No improvement suggestions were returned.
                </div>
              ) : (
                improvements.map((imp, idx) => {
                  const isThisLoading = loadingImprovementIndex === idx
                  const thisError = fixErrors[idx]

                  return (
                    <div
                      key={`${imp.issue || 'issue'}-${idx}`}
                      className={`bg-(--surface) rounded-xl border p-4 space-y-3 transition-colors ${
                        isThisLoading ? 'border-(--accent)/40' : 'border-(--accent-strong)/20'
                      }`}
                    >
                      <p className="text-sm text-(--muted)">{imp.issue || 'Improve clarity and impact.'}</p>
                      <div>
                        <p className="text-sm text-(--muted) mb-2">Current:</p>
                        <p className="text-sm bg-(--accent-muted) text-(--foreground) border-l-2 border-(--accent-strong) px-3 py-2">
                          {imp.weak_example || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-(--muted) mb-2">Suggested:</p>
                        <p className="text-sm bg-(--accent-muted) text-(--accent) border-l-2 border-(--border) px-3 py-2">
                          {imp.strong_example || 'N/A'}
                        </p>
                      </div>

                      <div className="pt-1">
                        {isThisLoading ? (
                          <span className="inline-flex items-center gap-2 text-sm text-(--accent)">
                            <Loader2 className="w-4 h-4 animate-spin" /> Applying fix...
                          </span>
                        ) : (
                          <>
                            {thisError ? (
                              <p className="text-xs text-red-400 mb-2">{thisError}</p>
                            ) : null}
                            {onApplyFix ? (
                              <button
                                onClick={() => void onApplyFix(idx)}
                                disabled={anyFixLoading}
                                className="text-(--accent) text-sm font-medium hover:text-(--accent-strong) flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Apply this fix <ArrowRight className="w-4 h-4" />
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <h3 className="text-(--accent) font-bold flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5" /> Strengths
            </h3>
            <div className="bg-(--surface) rounded-xl border border-(--accent)/20 p-4">
              {strengths.length === 0 ? (
                <p className="text-sm text-(--muted)">No strengths returned.</p>
              ) : (
                <ul className="space-y-3 text-sm text-(--muted)">
                  {strengths.map((s, idx) => (
                    <li key={`${s}-${idx}`} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-(--accent) shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Category Insights */}
          {categories.some((c) => c.feedback) ? (
            <div className="mt-8">
              <h3 className="text-(--accent-strong) font-bold flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> Category Insights
              </h3>
              <div className="space-y-3">
                {categories.map((c, idx) =>
                  c.feedback ? (
                    <div key={`${c.label || 'insight'}-${idx}`} className="bg-(--surface) rounded-xl border border-(--accent-strong)/25 p-4">
                      <p className="text-(--foreground) font-medium mb-1">{c.label || 'Category'}</p>
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
