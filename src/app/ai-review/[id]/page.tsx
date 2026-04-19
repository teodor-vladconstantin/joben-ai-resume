"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { ResumeAnalyzer, type AnalyzerReview } from '@/components/analyzer/ResumeAnalyzer'

export default function AIReviewEditorPage() {
  const params = useParams<{ id: string }>()
  const [review, setReview] = useState<AnalyzerReview | null>(null)
  const [comparison, setComparison] = useState<{
    previousScore: number | null
    previousReviewId: string | null
    delta: number | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div className="min-h-screen flex flex-col bg-[#020202]">
      <Navbar />
      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-20">
        <ResumeAnalyzer review={review} comparison={comparison} isLoading={isLoading} error={error} />
      </main>
    </div>
  )
}