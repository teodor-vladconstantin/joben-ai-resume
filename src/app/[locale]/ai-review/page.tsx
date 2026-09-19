"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { buttonVariants } from '@/components/ui/Button'
import { History, Star, TrendingUp, Upload, Target, Gauge, Search, Loader2 } from 'lucide-react'
import { AILoadingState } from '@/components/ui/AILoadingState'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'
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
    dynamicSections?: Array<{
      title?: string
      content?: string
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

  const experience = (payload.experience || []).map((e) => {
    const bullets = Array.isArray(e.bullets)
      ? e.bullets.map((b) => b.trim()).filter(Boolean)
      : []
    const bulletText = bullets.length > 0 ? bullets.join(' | ') : (e.description || '')
    return `${e.title || ''} at ${e.company || ''} (${e.period || ''}) ${bulletText}`
  })

  const dynamic = (payload.dynamicSections || []).map(
    (s) => `${s.title || ''}:\n${s.content || ''}`
  )

  return [...base, ...experience, ...dynamic].filter(Boolean).join('\n')
}

export default function AIReviewPage() {
  const t = useTranslations('AiReviewPage.list')
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
  const [upgradeMessage, setUpgradeMessage] = useState(t('defaultUpgradeMessage'))

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      const [resumesRes, reviewsRes] = await Promise.all([
        fetch('/api/resumes', { cache: 'no-store' }),
        fetch('/api/ai-reviews', { cache: 'no-store' }),
      ])

      if (!cancelled && resumesRes.ok) {
        const r = (await resumesRes.json()) as { resumes?: ResumeItem[]; data?: { resumes?: ResumeItem[] } }
        const list = r.data?.resumes || r.resumes || []
        setResumes(list)
        if (list.length > 0) setSelectedResumeId(list[0].id)
      }

      if (!cancelled && reviewsRes.ok) {
        const a = (await reviewsRes.json()) as { reviews?: ReviewItem[]; data?: { reviews?: ReviewItem[] } }
        setReviews(a.data?.reviews || a.reviews || [])
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
      setError(t('errorPdfOnly'))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t('errorPdfTooLarge'))
      return
    }

    setIsProcessingUpload(true)

    try {
      const result = await importPdfClientSide(file)
      const text = extractResumeText(result.data)

      if (!text.trim()) {
        setError(t('errorCouldNotExtractText'))
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
      setError((e as Error).message || t('errorFailedToParsePdf'))
    }

    setIsProcessingUpload(false)
  }

  async function handleAnalyze(targetResumeId?: string) {
    setError('')
    const uploadedText = !targetResumeId ? uploadedResumeText.trim() : ''
    const resumeId = uploadedText ? '' : (targetResumeId || selectedResumeId)

    if (!uploadedText && !resumeId) {
      setError(t('errorUploadOrSelect'))
      return
    }

    setIsAnalyzing(true)

    try {
      let resumeText = uploadedText

      if (!resumeText) {
        const detailRes = await fetch(`/api/resumes/${resumeId}`, { cache: 'no-store' })
        if (!detailRes.ok) {
          setError(t('errorCouldNotLoadResume'))
          setIsAnalyzing(false)
          return
        }

        const detail = (await detailRes.json()) as { resume?: { data?: unknown }; data?: { resume?: { data?: unknown } } }
        resumeText = extractResumeText(detail.data?.resume?.data ?? detail.resume?.data)
      }

      if (!resumeText.trim()) {
        setError(t('errorNoExtractableContent'))
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
          setUpgradeMessage(payload.error || t('errorProRequired'))
          setShowUpgradeModal(true)
          setIsAnalyzing(false)
          return
        }
        setError(payload.error || t('errorAnalyzeFailed'))
        setIsAnalyzing(false)
        return
      }

      if (payload.reviewId) {
        router.push(`/ai-review/${payload.reviewId}`)
        return
      }

      setError(t('errorMissingResultId'))
    } catch (e) {
      setError((e as Error).message)
    }

    setIsAnalyzing(false)
  }

  const visibleResumes = useMemo(() => {
    return resumes.filter((resume) =>
      (resume.title || t('untitledResume')).toLowerCase().includes(search.toLowerCase())
    )
  }, [resumes, search, t])

  const targetScore = 92
  const bestScore = useMemo(
    () => reviews.reduce((best, item) => Math.max(best, Number(item.score || 0)), 0),
    [reviews]
  )

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-(--foreground) mb-2">{t('pageTitle')}</h1>
            <p className="text-(--muted)">{t('pageSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 border border-(--border) divide-y divide-(--border) mb-6 md:grid-cols-4 md:divide-y-0 md:divide-x">
            <div className="p-4">
              <p className="text-xs text-(--muted) flex items-center gap-2"><Target className="w-4 h-4 text-(--muted)" /> {t('targetScoreLabel')}</p>
              <p className="font-mono text-3xl font-bold tabular-nums text-(--foreground) mt-2">{targetScore}<span className="font-sans text-sm text-(--muted) ml-2">+ {t('hireZoneSuffix')}</span></p>
            </div>
            <div className="p-4">
              <p className="text-xs text-(--muted) flex items-center gap-2"><Star className="w-4 h-4 text-(--muted)" /> {t('yourBestLabel')}</p>
              <p className="font-mono text-3xl font-bold tabular-nums text-(--foreground) mt-2">{bestScore}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-(--muted) flex items-center gap-2"><History className="w-4 h-4 text-(--muted)" /> {t('reviewsLabel')}</p>
              <p className="font-mono text-3xl font-bold tabular-nums text-(--foreground) mt-2">{reviews.length}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-(--muted) flex items-center gap-2"><Gauge className="w-4 h-4 text-(--muted)" /> {t('avgScoreLabel')}</p>
              <p className="font-mono text-3xl font-bold tabular-nums text-(--foreground) mt-2">{averageScore}<span className="font-sans text-sm text-(--muted)"> {t('outOf100')}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="border border-(--border) bg-(--surface) p-5">
              <h3 className="text-(--foreground) font-bold mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-(--muted)" /> {t('uploadNewResume')}</h3>
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
                className={`border border-dashed p-8 text-center transition-colors duration-150 ease-out ${
                  isDraggingUpload
                    ? 'border-(--accent) bg-(--accent-muted)'
                    : 'border-(--border) hover:border-(--accent)'
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
                <Upload className="mx-auto w-6 h-6 text-(--muted) mb-3" />
                <p className="text-(--foreground) font-semibold">{t('dropzoneText')}</p>
                <p className="text-xs text-(--muted)">{t('dropzoneHint')}</p>
                {isProcessingUpload ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-(--muted)">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t('readingPdf')}
                  </p>
                ) : null}
                {!isProcessingUpload && uploadedFileName ? (
                  <p className="mt-3 text-sm text-(--foreground)">{t('readyFile', { fileName: uploadedFileName })}</p>
                ) : null}
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="mt-4 w-full h-24 bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) resize-none transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none"
                placeholder={t('jobDescriptionPlaceholder')}
              />
              {error ? <p className="text-sm text-(--foreground) border-l-2 border-(--foreground) pl-2 mt-3">{error}</p> : null}
              {isAnalyzing ? (
                <div className="mt-4">
                  <AILoadingState stage="analyzing" />
                </div>
              ) : (
                <button
                  onClick={() => void handleAnalyze()}
                  disabled={isProcessingUpload}
                  className={`mt-4 inline-flex items-center gap-2 disabled:opacity-60 ${buttonVariants('primary', 'md')}`}
                >
                  <Star className="w-4 h-4 fill-current" /> {uploadedFileName ? t('reviewUploadedPdf') : t('startReview')}
                </button>
              )}
            </div>

            <div className="border border-(--border) bg-(--surface) p-5">
              <h3 className="text-(--foreground) font-bold mb-3">{t('industryBenchmark')}</h3>
              <div className="h-56 border border-(--border) flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="mx-auto h-8 w-8 text-(--muted) mb-2" />
                  <p className="text-(--muted)">{t('benchmarkStat')}</p>
                  <p className="text-(--foreground) text-sm mt-2 font-semibold">{t('seeHowToImprove')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-(--border) bg-(--surface) p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 className="text-xl font-bold text-(--foreground)">{t('reviewExistingResume')}</h3>
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-(--muted) absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full rounded-sm border border-(--border) bg-(--surface) py-2 pl-10 pr-3 text-sm text-(--foreground) transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none"
                />
              </div>
            </div>
            {visibleResumes.length === 0 ? (
              <div className="border border-dashed border-(--border) p-6 text-center text-sm text-(--muted)">
                {t('noResumesFound')}
              </div>
            ) : (
              <div className="grid grid-cols-1 border border-(--border) divide-y divide-(--border) md:grid-cols-2 md:divide-y-0 md:divide-x lg:grid-cols-3">
                {visibleResumes.map((resume) => {
                  const resumeReviews = reviews
                    .filter((review) => review.resume_id === resume.id)
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  const latestReview = resumeReviews.at(-1)
                  const hasReviews = resumeReviews.length > 0
                  const scoreHistory = resumeReviews.map((r) => Number(r.score || 0)).filter((s) => s > 0)
                  const latestScore = scoreHistory.at(-1) ?? Number(latestReview?.score || 0)
                  return (
                    <div key={resume.id} className="p-4">
                      <p className="text-(--foreground) font-semibold truncate">{resume.title || t('untitled')}</p>
                      {hasReviews ? (
                        <p className="text-xs text-(--muted) mt-1 flex items-center gap-1 flex-wrap">
                          {t('scoreValue', { score: latestScore })}
                        </p>
                      ) : (
                        <p className="text-xs text-(--muted) mt-1">{t('notReviewedYet')}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        {hasReviews && latestReview && (
                          <Link
                            href={`/ai-review/${latestReview.id}`}
                            className={`flex-1 ${buttonVariants('primary', 'sm')}`}
                          >
                            {t('viewLatest')}
                          </Link>
                        )}
                        <button
                          onClick={() => void handleAnalyze(resume.id)}
                          disabled={isAnalyzing}
                          className={`${hasReviews ? 'flex-1' : 'w-full'} ${buttonVariants('secondary', 'sm')} disabled:opacity-60`}
                        >
                          {hasReviews ? t('reReview') : t('startReview')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <UpgradeBanner
        open={showUpgradeModal}
        message={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  )
}
