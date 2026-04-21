"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import { History, Star, TrendingUp, Upload, Target, Gauge, Search, Loader2 } from 'lucide-react'
import { AILoadingState } from '@/components/ui/AILoadingState'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { startProCheckout } from '@/lib/client-billing'
import { importPdfClientSide } from '@/lib/pdf-import'

type ResumeItem = {
  id: string
  title: string | null
}

type ReviewItem = {
  id: string
  score: number | null
  created_at: string
  resume_id?: string | null
  resumes?: { title?: string } | Array<{ title?: string }> | null
}

function extractResumeText(data: unknown) {
  if (!data || typeof data !== 'object') return ''
  const payload = data as {
    personal?: {
      firstName?: string
      lastName?: string
      title?: string
      email?: string
      phone?: string
      summary?: string
    }
    experience?: Array<{
      title?: string
      company?: string
      period?: string
      description?: string
      bullets?: string[]
    }>
  }

  const personal = payload.personal || {}
  const base = [
    `${personal.firstName || ''} ${personal.lastName || ''}`.trim(),
    personal.title || '',
    personal.email || '',
    personal.phone || '',
    personal.summary || '',
  ]

  const experience = (payload.experience || []).map(
    (e) => {
      const bullets = Array.isArray(e.bullets)
        ? e.bullets.map((bullet) => bullet.trim()).filter(Boolean)
        : []
      const bulletText = bullets.length > 0 ? bullets.join(' | ') : (e.description || '')

      return `${e.title || ''} at ${e.company || ''} (${e.period || ''}) ${bulletText}`
    }
  )

  return [...base, ...experience].filter(Boolean).join('\n')
}

export default function AIReviewPage() {
  const router = useRouter()
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [uploadedResumeText, setUploadedResumeText] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [isProcessingUpload, setIsProcessingUpload] = useState(false)
  const [isDraggingUpload, setIsDraggingUpload] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('Upgrade to Pro for unlimited AI analysis.')

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      const [resumesRes, reviewsRes] = await Promise.all([
        fetch('/api/resumes', { cache: 'no-store' }),
        fetch('/api/ai-reviews', { cache: 'no-store' }),
      ])

      if (!cancelled && resumesRes.ok) {
        const r = (await resumesRes.json()) as { resumes?: ResumeItem[] }
        const list = r.resumes || []
        setResumes(list)
        if (list.length > 0) setSelectedResumeId(list[0].id)
      }

      if (!cancelled && reviewsRes.ok) {
        const a = (await reviewsRes.json()) as { reviews?: ReviewItem[] }
        setReviews(a.reviews || [])
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  const averageScore = useMemo(() => {
    if (reviews.length === 0) return 0
    const total = reviews.reduce((sum, r) => sum + Number(r.score || 0), 0)
    return Math.round(total / reviews.length)
  }, [reviews])

  async function handleUploadFile(file: File) {
    setError('')

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setError('Only PDF files are supported at the moment.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('PDF must be under 10 MB.')
      return
    }

    setIsProcessingUpload(true)

    try {
      const parsed = await importPdfClientSide(file)
      const text = extractResumeText(parsed)

      if (!text.trim()) {
        setError('Could not extract text from this PDF.')
        setUploadedResumeText('')
        setUploadedFileName('')
        setIsProcessingUpload(false)
        return
      }

      setUploadedResumeText(text)
      setUploadedFileName(file.name)
      setSelectedResumeId('')
    } catch (e) {
      setUploadedResumeText('')
      setUploadedFileName('')
      setError((e as Error).message || 'Failed to parse uploaded PDF.')
    }

    setIsProcessingUpload(false)
  }

  async function handleAnalyze(targetResumeId?: string) {
    setError('')
    const uploadedText = !targetResumeId ? uploadedResumeText.trim() : ''
    const resumeId = uploadedText ? '' : (targetResumeId || selectedResumeId)

    if (!uploadedText && !resumeId) {
      setError('Upload a resume PDF or select an existing resume first.')
      return
    }

    setIsAnalyzing(true)

    try {
      let resumeText = uploadedText

      if (!resumeText) {
        const detailRes = await fetch(`/api/resumes/${resumeId}`, { cache: 'no-store' })
        if (!detailRes.ok) {
          setError('Could not load the selected resume.')
          setIsAnalyzing(false)
          return
        }

        const detail = (await detailRes.json()) as { resume?: { data?: unknown } }
        resumeText = extractResumeText(detail.resume?.data)
      }

      if (!resumeText.trim()) {
        setError('This resume has no extractable content to analyze.')
        setIsAnalyzing(false)
        return
      }

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          resumeId: resumeId || null,
        }),
      })

      const payload = (await analyzeRes.json()) as {
        error?: string
        showUpgrade?: boolean
        reviewId?: string
      }

      if (!analyzeRes.ok) {
        if (payload.showUpgrade) {
          setUpgradeMessage(payload.error || 'This action requires Pro access.')
          setShowUpgradeModal(true)
          setIsAnalyzing(false)
          return
        }
        setError(payload.error || 'Analyze failed.')
        setIsAnalyzing(false)
        return
      }

      if (payload.reviewId) {
        router.push(`/ai-review/${payload.reviewId}`)
        return
      }

      setError('Analysis succeeded but result id is missing.')
    } catch (e) {
      setError((e as Error).message)
    }

    setIsAnalyzing(false)
  }

  const visibleResumes = useMemo(() => {
    return resumes.filter((resume) =>
      (resume.title || 'Untitled Resume').toLowerCase().includes(search.toLowerCase())
    )
  }, [resumes, search])

  const targetScore = 92
  const bestScore = useMemo(
    () => reviews.reduce((best, item) => Math.max(best, Number(item.score || 0)), 0),
    [reviews]
  )

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />

      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Resume Review</h1>
          <p className="text-[#FFFFFF]/82">Get instant AI-powered feedback across 5 key categories.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-white/10 bg-[#0A0F0D] p-4">
            <p className="text-xs text-[#FFFFFF]/82 flex items-center gap-2"><Target className="w-4 h-4 text-[#16DB65]" /> Target Score</p>
            <p className="text-3xl font-black text-white mt-2">{targetScore}<span className="text-sm text-[#16DB65] ml-2">+ Hire Zone</span></p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A0F0D] p-4">
            <p className="text-xs text-[#FFFFFF]/82 flex items-center gap-2"><Star className="w-4 h-4 text-[#0A9548]" /> Your Best</p>
            <p className="text-3xl font-black text-[#0A9548] mt-2">{bestScore}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A0F0D] p-4">
            <p className="text-xs text-[#FFFFFF]/82 flex items-center gap-2"><History className="w-4 h-4 text-blue-400" /> Reviews</p>
            <p className="text-3xl font-black text-white mt-2">{reviews.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A0F0D] p-4">
            <p className="text-xs text-[#FFFFFF]/82 flex items-center gap-2"><Gauge className="w-4 h-4 text-yellow-400" /> Avg Score</p>
            <p className="text-3xl font-black text-white mt-2">{averageScore}<span className="text-sm text-[#FFFFFF]/82"> /100</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-[#0A9548]" /> Upload New Resume</h3>
            <input
              ref={uploadInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleUploadFile(file)
                }
                e.currentTarget.value = ''
              }}
            />
            <div
              role="button"
              tabIndex={0}
              className={`rounded-xl border border-dashed bg-[#0A0F0D] p-8 text-center transition-colors ${
                isDraggingUpload
                  ? 'border-[#16DB65]/60 bg-[#0A9548]/10'
                  : 'border-white/10 hover:border-[#16DB65]/40'
              }`}
              onClick={() => uploadInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  uploadInputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingUpload(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDraggingUpload(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDraggingUpload(false)
                const file = e.dataTransfer.files?.[0]
                if (file) {
                  void handleUploadFile(file)
                }
              }}
            >
              <Upload className="mx-auto w-6 h-6 text-[#FFFFFF]/60 mb-3" />
              <p className="text-white font-semibold">Drag & drop or click to browse</p>
              <p className="text-xs text-[#FFFFFF]/60">PDF only - Max 10MB</p>
              {isProcessingUpload ? (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#0A9548]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading PDF...
                </p>
              ) : null}
              {!isProcessingUpload && uploadedFileName ? (
                <p className="mt-3 text-sm text-[#16DB65]">Ready: {uploadedFileName}</p>
              ) : null}
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="mt-4 w-full h-24 bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white resize-none"
              placeholder="Optional job description for more accurate analysis"
            />
            {error ? <p className="text-sm text-red-400 mt-3">{error}</p> : null}
            {isAnalyzing ? (
              <div className="mt-4">
                <AILoadingState stage="analyzing" />
              </div>
            ) : (
              <button
                onClick={() => void handleAnalyze()}
                disabled={isProcessingUpload}
                className="mt-4 bg-linear-to-r from-[#0A9548] to-[#04471C] text-white px-5 py-2.5 rounded-xl font-semibold transition-opacity hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Star className="w-4 h-4 fill-white" /> {uploadedFileName ? 'Review Uploaded PDF' : 'Start Review'}
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-5">
            <h3 className="text-white font-bold mb-3">Industry Benchmark</h3>
            <div className="h-56 rounded-xl bg-[#0A0F0D] border border-white/10 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-[#0A9548] mb-2" />
                <p className="text-[#FFFFFF]/72">Resumes scoring 92+ get 3x more callbacks</p>
                <p className="text-[#0A9548] text-sm mt-2 font-semibold">See how to improve</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Review Existing Resume</h3>
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-[#FFFFFF]/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resumes..."
                className="w-full rounded-lg border border-white/10 bg-[#0A0F0D] py-2 pl-10 pr-3 text-sm text-white focus:border-[#16DB65] focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleResumes.map((resume) => {
              const resumeReviews = reviews
                .filter((review) => review.resume_id === resume.id)
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              const latestReview = resumeReviews.at(-1)
              const hasReviews = resumeReviews.length > 0
              const scoreHistory = resumeReviews.map((r) => Number(r.score || 0)).filter((s) => s > 0)
              return (
                <div key={resume.id} className="rounded-xl border border-white/10 bg-[#0A0F0D] p-4">
                  <p className="text-white font-semibold truncate">{resume.title || 'Untitled'}</p>
                  {hasReviews ? (
                    <p className="text-xs text-[#FFFFFF]/60 mt-1 flex items-center gap-1 flex-wrap">
                      {scoreHistory.length > 1 ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-[#0A9548] shrink-0" />
                          {scoreHistory.join(' → ')}
                        </>
                      ) : (
                        `Score ${scoreHistory[0] ?? 0}`
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-[#FFFFFF]/60 mt-1">Not reviewed yet</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {hasReviews && latestReview && (
                      <Link
                        href={`/ai-review/${latestReview.id}`}
                        className="flex-1 rounded-lg bg-linear-to-r from-[#0A9548] to-[#04471C] px-3 py-2 text-sm text-white font-semibold inline-flex items-center justify-center"
                      >
                        View Latest
                      </Link>
                    )}
                    <button
                      onClick={() => void handleAnalyze(resume.id)}
                      disabled={isAnalyzing}
                      className={`${hasReviews ? 'flex-1' : 'w-full'} rounded-lg border border-[#0A9548]/30 bg-[#0A9548]/10 px-3 py-2 text-sm text-[#0A9548] font-semibold disabled:opacity-60`}
                    >
                      {hasReviews ? 'Re-review' : 'Start Review'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <UpgradeModal
        open={showUpgradeModal}
        title="Upgrade to Pro Analyzer"
        description={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={startProCheckout}
      />
    </div>
  )
}

