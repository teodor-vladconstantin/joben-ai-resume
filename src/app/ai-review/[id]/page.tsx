"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { ResumeAnalyzer, type AnalyzerReview } from '@/components/analyzer/ResumeAnalyzer'

const SECTION_FOR_CATEGORY_INDEX: Record<number, string> = {
  0: 'experience', // ats_structure
  1: 'experience', // content_quality
  2: 'experience', // writing_quality
  3: 'experience', // job_match
  4: 'personal',   // application_ready
}

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
  const [isSavingAutoFix, setIsSavingAutoFix] = useState(false)

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
    return () => {
      cancelled = true
    }
  }, [params?.id])

  const rawReviewId = params?.id
  const reviewId = Array.isArray(rawReviewId) ? (rawReviewId[0] || '') : (rawReviewId || '')

  function builderHref(section?: string, bulletIndex?: number): string {
    if (!review?.resume_id) return ''
    const base = `/resumes/${review.resume_id}?source=ai-review&reviewId=${encodeURIComponent(reviewId)}`
    if (section !== undefined) {
      return `${base}&section=${encodeURIComponent(section)}${bulletIndex !== undefined ? `&bulletIndex=${bulletIndex}` : ''}`
    }
    return base
  }

  const handleAutoFix = async () => {
    if (!reviewId || !review) return
    setIsSavingAutoFix(true)

    try {
      await fetch('/api/resume-analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          resumeId: review.resume_id || undefined,
          analysisJson: review.feedback as Record<string, unknown> | undefined,
          status: 'pending',
        }),
      })
    } catch {
      // non-blocking — proceed with navigation even if save fails
    }

    setIsSavingAutoFix(false)
    const href = builderHref()
    if (href) router.push(href)
  }

  const handleApplyFix = async (improvementIndex: number) => {
    if (!reviewId || !review?.resume_id) return

    try {
      await fetch('/api/resume-analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          resumeId: review.resume_id,
          analysisJson: review.feedback as Record<string, unknown> | undefined,
          status: 'applied',
        }),
      })
    } catch {
      // non-blocking
    }

    const section = SECTION_FOR_CATEGORY_INDEX[improvementIndex] ?? 'experience'
    router.push(builderHref(section, improvementIndex))
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020202]">
      <Navbar />
      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-20">
        <ResumeAnalyzer
          review={review}
          comparison={comparison}
          isLoading={isLoading}
          error={error}
          canApplyFixes={Boolean(reviewId && review?.resume_id)}
          isSavingAutoFix={isSavingAutoFix}
          onAutoFix={handleAutoFix}
          onApplyFix={handleApplyFix}
        />
      </main>
    </div>
  )
}
