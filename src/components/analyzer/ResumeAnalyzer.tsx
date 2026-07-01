"use client"

import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Zap, Loader2 } from 'lucide-react'
import { AILoadingState } from '@/components/ui/AILoadingState'

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

/** Tailwind color class keyed to 0-100 score */
function scoreColorClass(score: number): string {
  if (score >= 85) return 'text-success'
  if (score >= 50) return 'text-warning'
  return 'text-error'
}

/** Design-token color for score ring (still needs inline style for SVG) */
function scoreColorHex(score: number): string {
  if (score >= 85) return 'var(--success)'
  if (score >= 50) return 'var(--warning)'
  return 'var(--error)'
}

/** Hex color for category progress bars based on fraction achieved. */
function categoryColorHex(score: number, max: number): string {
  return scoreColorHex(max > 0 ? Math.round((score / max) * 100) : 0)
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
      <div className="bg-bg-surface border border-border-soft rounded-lg p-10 text-center">
        <AILoadingState stage="generating" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-bg-surface border border-error-muted rounded-lg p-10 text-center text-error">
        {error}
      </div>
    )
  }

  if (!review) {
    return (
      <div className="bg-bg-surface border border-border-soft rounded-lg p-10 text-center text-text-secondary">
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
  const ringColor = scoreColorHex(overallScore)
  const ringColorClass = scoreColorClass(overallScore)

  const anyFixLoading = loadingImprovementIndex !== null || isSavingAutoFix

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel */}
      <div className="lg:col-span-1 space-y-6">
        {/* Score card */}
        <div className="bg-bg-surface border border-border-soft rounded-lg p-6 text-center">
          <h3 className="text-text-secondary text-xs uppercase tracking-wide mb-4">Overall Match Score</h3>

          <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-4">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-soft)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={ringColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${overallScore * 2.64} 264`}
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-display font-semibold text-text-primary">{overallScore}</span>
              <span className={`text-xs ${ringColorClass}`}>/ 100</span>
            </div>
          </div>

          <p className={`font-medium text-heading ${ringColorClass} mb-1`}>{grade}</p>
          <p className="text-small text-text-muted">Review for {getResumeTitle(review.resumes)}.</p>

          {comparison ? (
            <div className="mt-4 rounded-md border border-border-soft bg-bg-subtle px-3 py-2 text-left">
              <p className="text-xs text-text-muted">vs previous review</p>
              {comparison.delta === null ? (
                <p className="mt-1 text-small text-text-secondary">First review for this resume.</p>
              ) : (
                <p className={`mt-1 text-small font-medium ${comparison.delta >= 0 ? 'text-success' : 'text-error'}`}>
                  {comparison.delta >= 0 ? '+' : ''}{comparison.delta} pts
                  <span className="ml-2 text-xs text-text-muted">
                    (prev: {comparison.previousScore ?? 0})
                  </span>
                </p>
              )}
            </div>
          ) : null}

          {/* Auto Fix button */}
          <div className="mt-6">
            {isSavingAutoFix ? (
              <AILoadingState stage="saving" />
            ) : (
              <button
                onClick={() => void onAutoFix?.()}
                disabled={!canApplyFixes || anyFixLoading}
                className="w-full px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-md border border-accent-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Zap size={14} className="fill-current" /> Auto-Fix All
              </button>
            )}
            {autoFixError ? (
              <p className="mt-2 text-xs text-error">{autoFixError}</p>
            ) : null}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="bg-bg-surface border border-border-soft rounded-lg p-4">
          <h3 className="text-heading font-medium text-text-primary mb-4">Score Breakdown</h3>
          <div className="space-y-3">
            {categories.map((item, idx) => {
              const score = Number(item.score || 0)
              const max = Number(item.max || 100)
              const width = Math.max(0, Math.min(100, Math.round((score / max) * 100)))
              return (
                <div key={`${item.label || 'cat'}-${idx}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">{item.label || 'Category'}</span>
                    <span className="text-text-primary font-medium">{score}/{max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-subtle rounded-full">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${width}%`, backgroundColor: categoryColorHex(score, max) }}
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
        <div className="bg-bg-surface border border-border-soft rounded-lg p-6">
          <h2 className="text-title font-semibold text-text-primary mb-6 border-b border-border-faint pb-3">Actionable Feedback</h2>

          {/* Priority Improvements */}
          <div className="mb-8">
            <h3 className="text-error font-medium flex items-center gap-2 mb-4">
              <XCircle size={16} /> Priority Improvements
            </h3>
            <div className="space-y-3">
              {improvements.length === 0 ? (
                <div className="bg-bg-subtle rounded-md border border-border-soft p-4 text-small text-text-secondary">
                  No improvement suggestions were returned.
                </div>
              ) : (
                improvements.map((imp, idx) => {
                  const isThisLoading = loadingImprovementIndex === idx
                  const thisError = fixErrors[idx]

                  return (
                    <div
                      key={`${imp.issue || 'issue'}-${idx}`}
                      className="bg-bg-subtle rounded-md border border-border-soft p-4 space-y-3"
                    >
                      <p className="text-small text-text-secondary">{imp.issue || 'Improve clarity and impact.'}</p>
                      <div>
                        <p className="text-small text-text-muted mb-1">Current:</p>
                        <p className="text-small bg-bg-surface border-l-2 border-border-soft px-3 py-2 text-text-secondary">
                          {imp.weak_example || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-small text-text-muted mb-1">Suggested:</p>
                        <p className="text-small bg-bg-surface border-l-2 border-accent px-3 py-2 text-accent">
                          {imp.strong_example || 'N/A'}
                        </p>
                      </div>

                      <div className="pt-1">
                        {isThisLoading ? (
                          <span className="inline-flex items-center gap-2 text-small text-accent">
                            <Loader2 size={14} className="animate-spin" /> Applying fix...
                          </span>
                        ) : (
                          <>
                            {thisError ? (
                              <p className="text-xs text-error mb-2">{thisError}</p>
                            ) : null}
                            {onApplyFix ? (
                              <button
                                onClick={() => void onApplyFix(idx)}
                                disabled={anyFixLoading}
                                className="text-accent text-small font-medium hover:text-accent-hover flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Apply this fix <ArrowRight size={14} />
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
            <h3 className="text-success font-medium flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} /> Strengths
            </h3>
            <div className="bg-bg-subtle rounded-md border border-border-soft p-4">
              {strengths.length === 0 ? (
                <p className="text-small text-text-secondary">No strengths returned.</p>
              ) : (
                <ul className="space-y-2 text-small text-text-secondary">
                  {strengths.map((s, idx) => (
                    <li key={`${s}-${idx}`} className="flex gap-2">
                      <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Category Insights */}
          {categories.some((c) => c.feedback) ? (
            <div className="mt-8">
              <h3 className="text-text-primary font-medium flex items-center gap-2 mb-4">
                <AlertTriangle size={16} /> Category Insights
              </h3>
              <div className="space-y-2">
                {categories.map((c, idx) =>
                  c.feedback ? (
                    <div key={`${c.label || 'insight'}-${idx}`} className="bg-bg-subtle rounded-md border border-border-soft p-3">
                      <p className="text-small text-text-primary font-medium mb-1">{c.label || 'Category'}</p>
                      <p className="text-small text-text-secondary">{c.feedback}</p>
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
