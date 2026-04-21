"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { ResumeAnalyzer, type AnalyzerReview, type Improvement } from '@/components/analyzer/ResumeAnalyzer'

export default function AIReviewEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [review, setReview] = useState<AnalyzerReview | null>(null)
  const [comparison, setComparison] = useState<{
    previousScore: number | null
    previousReviewId: string | null
    delta: number | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Per-improvement state
  const [loadingImprovementIndex, setLoadingImprovementIndex] = useState<number | null>(null)
  const [fixErrors, setFixErrors] = useState<Record<number, string>>({})

  // Auto-fix state
  const [isSavingAutoFix, setIsSavingAutoFix] = useState(false)
  const [autoFixError, setAutoFixError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadReview() {
      const id = params?.id
      if (!id) {
        setError('Missing review id')
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/ai-reviews/${id}`, { cache: 'no-store' })
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        if (!cancelled) {
          setError(payload.error || 'Failed to load review')
          setIsLoading(false)
        }
        return
      }

      const payload = (await response.json()) as {
        review?: AnalyzerReview
        comparison?: {
          previousScore: number | null
          previousReviewId: string | null
          delta: number | null
        } | null
      }

      if (!cancelled) {
        setReview(payload.review || null)
        setComparison(payload.comparison || null)
        setIsLoading(false)
      }
    }

    loadReview()
    return () => { cancelled = true }
  }, [params?.id])

  const rawReviewId = params?.id
  const reviewId = Array.isArray(rawReviewId) ? (rawReviewId[0] || '') : (rawReviewId || '')
  const resumeId = review?.resume_id || null

  function builderUrl(params: Record<string, string>): string {
    if (!resumeId) return ''
    const base = `/resumes/${resumeId}`
    const query = new URLSearchParams({ source: 'ai-review', reviewId, ...params })
    return `${base}?${query.toString()}`
  }

  const handleApplyFix = async (improvementIndex: number) => {
    if (!resumeId || !reviewId) return
    const improvements = review?.feedback?.improvements || []
    const improvement: Improvement = improvements[improvementIndex] || {}

    setLoadingImprovementIndex(improvementIndex)
    setFixErrors((prev) => {
      const next = { ...prev }
      delete next[improvementIndex]
      return next
    })

    try {
      const res = await fetch('/api/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, reviewId, improvement }),
      })

      const payload = (await res.json()) as {
        error?: string
        applied?: boolean
        experienceId?: string
        bulletIndex?: number
        limitType?: string
      }

      if (!res.ok || !payload.applied) {
        setFixErrors((prev) => ({
          ...prev,
          [improvementIndex]: payload.error || 'Could not apply this fix. Try again.',
        }))
        return
      }

      // Navigate to builder, land on the fixed bullet
      const url = builderUrl({
        fixApplied: 'true',
        ...(payload.experienceId ? { experienceId: payload.experienceId } : {}),
        ...(payload.bulletIndex !== undefined ? { bulletIndex: String(payload.bulletIndex) } : {}),
      })
      if (url) router.push(url)
    } catch {
      setFixErrors((prev) => ({
        ...prev,
        [improvementIndex]: 'Network error. Please retry.',
      }))
    } finally {
      setLoadingImprovementIndex(null)
    }
  }

  const handleAutoFix = async () => {
    if (!resumeId || !reviewId) return
    const improvements = review?.feedback?.improvements || []
    if (improvements.length === 0) return

    setIsSavingAutoFix(true)
    setAutoFixError('')

    try {
      const res = await fetch('/api/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, reviewId, improvements }),
      })

      const payload = (await res.json()) as {
        error?: string
        fixesApplied?: number
      }

      if (!res.ok) {
        setAutoFixError(payload.error || 'Auto-fix failed. Please retry.')
        return
      }

      const count = payload.fixesApplied ?? 0
      const url = builderUrl({ fixesApplied: String(count) })
      if (url) router.push(url)
    } catch {
      setAutoFixError('Network error. Please retry.')
    } finally {
      setIsSavingAutoFix(false)
    }
  }

  const canApplyFixes = Boolean(reviewId && resumeId)

  return (
    <div className="min-h-screen flex flex-col bg-[#020202]">
      <Navbar />
      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-20">
        <ResumeAnalyzer
          review={review}
          comparison={comparison}
          isLoading={isLoading}
          error={error}
          canApplyFixes={canApplyFixes}
          isSavingAutoFix={isSavingAutoFix}
          autoFixError={autoFixError}
          loadingImprovementIndex={loadingImprovementIndex}
          fixErrors={fixErrors}
          onAutoFix={handleAutoFix}
          onApplyFix={handleApplyFix}
        />
      </main>
    </div>
  )
}
