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

function statusColor(status?: string) {
  if (status === 'good') return 'bg-[#0A9548]'
  if (status === 'ok') return 'bg-[#16DB65]'
  return 'bg-[#0A9548]'
}

function scoreColor(score: number) {
  if (score >= 90) return '#16DB65'
  if (score >= 75) return '#0A9548'
  if (score >= 65) return '#0A9548'
  if (score >= 50) return '#0A9548'
  return '#0A9548'
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
      <div className="bg-[#0A0F0D] rounded-2xl border border-white/10 p-10 text-center">
        <AILoadingState stage="generating" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#0A0F0D] rounded-2xl border border-[#16DB65]/30 p-10 text-center text-[#16DB65]">
        {error}
      </div>
    )
  }

  if (!review) {
    return (
      <div className="bg-[#0A0F0D] rounded-2xl border border-white/10 p-10 text-center text-[#FFFFFF]/72">
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
        <div className="bg-[#0A0F0D] rounded-3xl border border-white/10 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0A9548]/10 rounded-bl-[100px] pointer-events-none" />
          <h3 className="text-[#FFFFFF]/82 font-medium mb-4 uppercase tracking-wider text-sm">Overall Match Score</h3>

          <div className="relative w-40 h-40 mx-auto flex items-center justify-center rounded-full border-12 border-white/10 mb-6">
            <div
              className="absolute inset-0 border-12 rounded-full border-l-transparent border-b-transparent transform rotate-45"
              style={{ borderColor: ringColor }}
            />
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-white">{overallScore}</span>
              <span className="font-bold text-sm" style={{ color: ringColor }}>/ 100</span>
            </div>
          </div>

          <p className="text-white font-bold text-xl mb-2">{grade}</p>
          <p className="text-sm text-[#FFFFFF]/82">Review for {getResumeTitle(review.resumes)}.</p>

          {comparison ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-[#020202] px-4 py-3 text-left">
              <p className="text-xs uppercase tracking-wide text-[#FFFFFF]/60">vs previous review</p>
              {comparison.delta === null ? (
                <p className="mt-1 text-sm text-[#FFFFFF]/72">First review for this resume.</p>
              ) : (
                <p className={`mt-1 text-sm font-semibold ${comparison.delta >= 0 ? 'text-[#16DB65]' : 'text-[#16DB65]'}`}>
                  {comparison.delta >= 0 ? '+' : ''}{comparison.delta} pts
                  <span className="ml-2 text-xs font-normal text-[#FFFFFF]/72">
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
                className="w-full bg-linear-to-r from-[#0A9548] to-[#04471C] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="w-5 h-5 fill-current" /> Auto-Fix All
              </button>
            )}
            {autoFixError ? (
              <p className="mt-2 text-xs text-[#16DB65]">{autoFixError}</p>
            ) : null}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="bg-[#0A0F0D] rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-bold mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            {categories.map((item, idx) => {
              const score = Number(item.score || 0)
              const max = Number(item.max || 100)
              const width = Math.max(0, Math.min(100, Math.round((score / max) * 100)))
              return (
                <div key={`${item.label || 'cat'}-${idx}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#FFFFFF]/72">{item.label || 'Category'}</span>
                    <span className="text-white font-bold">{score}/{max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#020202] rounded-full">
                    <div className={`h-1.5 rounded-full ${statusColor(item.status)}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#0A0F0D] rounded-3xl border border-white/10 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Actionable Feedback</h2>

          {/* Priority Improvements */}
          <div className="mb-8">
            <h3 className="text-[#0A9548] font-bold flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5" /> Priority Improvements
            </h3>
            <div className="space-y-4">
              {improvements.length === 0 ? (
                <div className="bg-[#0A0F0D] rounded-xl border border-[#16DB65]/20 p-4 text-sm text-[#FFFFFF]/72">
                  No improvement suggestions were returned.
                </div>
              ) : (
                improvements.map((imp, idx) => {
                  const isThisLoading = loadingImprovementIndex === idx
                  const thisError = fixErrors[idx]

                  return (
                    <div
                      key={`${imp.issue || 'issue'}-${idx}`}
                      className={`bg-[#0A0F0D] rounded-xl border p-4 space-y-3 transition-colors ${
                        isThisLoading ? 'border-[#0A9548]/40' : 'border-[#16DB65]/20'
                      }`}
                    >
                      <p className="text-sm text-[#FFFFFF]/72">{imp.issue || 'Improve clarity and impact.'}</p>
                      <div>
                        <p className="text-sm text-[#FFFFFF]/82 mb-2">Current:</p>
                        <p className="text-sm bg-[#0A9548]/12 text-[#C8FFD9] border-l-2 border-[#16DB65] px-3 py-2">
                          {imp.weak_example || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#FFFFFF]/82 mb-2">Suggested:</p>
                        <p className="text-sm bg-[#0A9548]/10 text-[#0A9548] border-l-2 border-white/10 px-3 py-2">
                          {imp.strong_example || 'N/A'}
                        </p>
                      </div>

                      <div className="pt-1">
                        {isThisLoading ? (
                          <span className="inline-flex items-center gap-2 text-sm text-[#0A9548]">
                            <Loader2 className="w-4 h-4 animate-spin" /> Applying fix...
                          </span>
                        ) : (
                          <>
                            {thisError ? (
                              <p className="text-xs text-[#16DB65] mb-2">{thisError}</p>
                            ) : null}
                            {onApplyFix ? (
                              <button
                                onClick={() => void onApplyFix(idx)}
                                disabled={anyFixLoading}
                                className="text-[#0A9548] text-sm font-medium hover:text-[#16DB65] flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h3 className="text-[#0A9548] font-bold flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5" /> Strengths
            </h3>
            <div className="bg-[#0A0F0D] rounded-xl border border-[#0A9548]/20 p-4">
              {strengths.length === 0 ? (
                <p className="text-sm text-[#FFFFFF]/72">No strengths returned.</p>
              ) : (
                <ul className="space-y-3 text-sm text-[#FFFFFF]/72">
                  {strengths.map((s, idx) => (
                    <li key={`${s}-${idx}`} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0A9548] shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Category Insights */}
          {categories.some((c) => c.feedback) ? (
            <div className="mt-8">
              <h3 className="text-[#16DB65] font-bold flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> Category Insights
              </h3>
              <div className="space-y-3">
                {categories.map((c, idx) =>
                  c.feedback ? (
                    <div key={`${c.label || 'insight'}-${idx}`} className="bg-[#0A0F0D] rounded-xl border border-[#16DB65]/25 p-4">
                      <p className="text-white font-medium mb-1">{c.label || 'Category'}</p>
                      <p className="text-sm text-[#FFFFFF]/72">{c.feedback}</p>
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

