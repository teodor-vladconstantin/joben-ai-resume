"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { ResumeAnalyzer, type AnalyzerReview, type Improvement } from '@/components/analyzer/ResumeAnalyzer'
import type { FixPatchWithContext } from '@/components/ui/BeforeAfterModal'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { startProCheckout } from '@/lib/client-billing'

const SESSION_KEY = 'ai-fix-patches'

function storePatches(patches: FixPatchWithContext[]) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(patches))
  } catch {
    // sessionStorage unavailable — silent fail, modal just won't show
  }
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

  const [loadingImprovementIndex, setLoadingImprovementIndex] = useState<number | null>(null)
  const [fixErrors, setFixErrors] = useState<Record<number, string>>({})

  const [isSavingAutoFix, setIsSavingAutoFix] = useState(false)
  const [autoFixError, setAutoFixError] = useState('')
  const [showAutoFixTokenWarning, setShowAutoFixTokenWarning] = useState(false)
  const [autoFixTokenWarning, setAutoFixTokenWarning] = useState('')
  const [autoFixTokenDetails, setAutoFixTokenDetails] = useState<{
    estimatedInputTokens?: number
    remainingTokens?: number | null
    resetAt?: string
  } | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('Upgrade to Pro to keep applying AI fixes.')

  useEffect(() => {
    let cancelled = false

    async function loadReview() {
      const id = params?.id
      if (!id) { setError('Missing review id'); setIsLoading(false); return }

      const response = await fetch(`/api/ai-reviews/${id}`, { cache: 'no-store' })
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        if (!cancelled) { setError(payload.error || 'Failed to load review'); setIsLoading(false) }
        return
      }

      const payload = (await response.json()) as {
        review?: AnalyzerReview
        comparison?: { previousScore: number | null; previousReviewId: string | null; delta: number | null } | null
        data?: {
          review?: AnalyzerReview
          comparison?: { previousScore: number | null; previousReviewId: string | null; delta: number | null } | null
        }
      }

      if (!cancelled) {
        const responseData = payload.data || {}
        setReview(responseData.review || payload.review || null)
        setComparison(responseData.comparison || payload.comparison || null)
        setIsLoading(false)
      }
    }

    loadReview()
    return () => { cancelled = true }
  }, [params?.id])

  const rawReviewId = params?.id
  const reviewId = Array.isArray(rawReviewId) ? (rawReviewId[0] || '') : (rawReviewId || '')
  const resumeId = review?.resume_id || null

  function builderUrl(extra: Record<string, string> = {}): string {
    if (!resumeId) return ''
    const q = new URLSearchParams({ source: 'ai-review', reviewId, ...extra })
    return `/resumes/${resumeId}?${q.toString()}`
  }

  const handleApplyFix = async (improvementIndex: number) => {
    if (!resumeId || !reviewId) return
    const improvement: Improvement = (review?.feedback?.improvements || [])[improvementIndex] || {}

    setLoadingImprovementIndex(improvementIndex)
    setFixErrors((prev) => { const next = { ...prev }; delete next[improvementIndex]; return next })

    try {
      const res = await fetch('/api/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, reviewId, improvement }),
      })

      const payload = (await res.json()) as {
        error?: string
        applied?: boolean
        showUpgrade?: boolean
        experienceId?: string
        bulletIndex?: number
        originalBullet?: string
        updatedBullet?: string
        experienceTitle?: string
        company?: string
      }

      if (!res.ok || !payload.applied) {
        if (payload.showUpgrade) {
          setUpgradeMessage(payload.error || 'This AI fix is available on Pro.')
          setShowUpgradeModal(true)
          return
        }
        setFixErrors((prev) => ({ ...prev, [improvementIndex]: payload.error || 'Could not apply this fix. Try again.' }))
        return
      }

      // Store before/after for modal in builder
      storePatches([{
        experienceId: payload.experienceId!,
        bulletIndex: payload.bulletIndex!,
        originalBullet: payload.originalBullet || '',
        updatedBullet: payload.updatedBullet!,
        experienceTitle: payload.experienceTitle || '',
        company: payload.company || '',
      }])

      const url = builderUrl({
        fixApplied: 'true',
        ...(payload.experienceId ? { experienceId: payload.experienceId } : {}),
        ...(payload.bulletIndex !== undefined ? { bulletIndex: String(payload.bulletIndex) } : {}),
      })
      if (url) router.push(url)
    } catch {
      setFixErrors((prev) => ({ ...prev, [improvementIndex]: 'Network error. Please retry.' }))
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
    setShowAutoFixTokenWarning(false)
    setAutoFixTokenWarning('')
    setAutoFixTokenDetails(null)

    try {
      const precheckRes = await fetch('/api/auto-fix?dryRun=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, reviewId, improvements }),
      })

      const precheckPayload = (await precheckRes.json()) as {
        allowed?: boolean
        error?: string
        limitType?: string
        estimatedInputTokens?: number
        remainingTokens?: number | null
        resetAt?: string
      }

      if (!precheckRes.ok || precheckPayload.allowed === false) {
        setAutoFixTokenWarning(precheckPayload.error || 'Auto-fix cannot run due to token limits.')
        setAutoFixTokenDetails({
          estimatedInputTokens: precheckPayload.estimatedInputTokens,
          remainingTokens: precheckPayload.remainingTokens,
          resetAt: precheckPayload.resetAt,
        })
        setShowAutoFixTokenWarning(true)
        setIsSavingAutoFix(false)
        return
      }

      const res = await fetch('/api/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, reviewId, improvements }),
      })

      const payload = (await res.json()) as {
        error?: string
        showUpgrade?: boolean
        fixesApplied?: number
        patches?: FixPatchWithContext[]
      }

      if (!res.ok) {
        if (payload.showUpgrade) {
          setUpgradeMessage(payload.error || 'Auto-fix is available on Pro.')
          setShowUpgradeModal(true)
          return
        }
        setAutoFixError(payload.error || 'Auto-fix failed. Please retry.')
        return
      }

      if (Array.isArray(payload.patches) && payload.patches.length > 0) {
        storePatches(payload.patches)
      }

      router.push(builderUrl({ fixesApplied: String(payload.fixesApplied ?? 0) }))
    } catch {
      setAutoFixError('Network error. Please retry.')
    } finally {
      setIsSavingAutoFix(false)
    }
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
          canApplyFixes={Boolean(reviewId && resumeId)}
          isSavingAutoFix={isSavingAutoFix}
          autoFixError={autoFixError}
          loadingImprovementIndex={loadingImprovementIndex}
          fixErrors={fixErrors}
          onAutoFix={handleAutoFix}
          onApplyFix={handleApplyFix}
        />
      </main>

      {showAutoFixTokenWarning ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAutoFixTokenWarning(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0F0D] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Auto-fix unavailable</h3>
            <p className="mt-2 text-sm text-[#FFFFFF]/82">
              {autoFixTokenWarning || 'Auto-fix cannot run due to token limits.'}
            </p>
            {autoFixTokenDetails ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-[#020202] px-4 py-3 text-xs text-[#FFFFFF]/72 space-y-1">
                {typeof autoFixTokenDetails.estimatedInputTokens === 'number' ? (
                  <p>Estimated input tokens: {autoFixTokenDetails.estimatedInputTokens}</p>
                ) : null}
                {typeof autoFixTokenDetails.remainingTokens === 'number' ? (
                  <p>Remaining monthly tokens: {autoFixTokenDetails.remainingTokens}</p>
                ) : null}
                {autoFixTokenDetails.resetAt ? (
                  <p>Resets at: {new Date(autoFixTokenDetails.resetAt).toLocaleString()}</p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAutoFixTokenWarning(false)}
                className="rounded-lg bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <UpgradeModal
        open={showUpgradeModal}
        title="Pro Feature"
        description={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={startProCheckout}
      />
    </div>
  )
}
