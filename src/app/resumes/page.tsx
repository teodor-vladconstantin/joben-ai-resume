"use client"

import { Navbar } from '@/components/ui/Navbar'
import Link from 'next/link'
import { Plus, Clock3, Trash2, Edit, Eye, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { startProCheckout } from '@/lib/client-billing'

type ResumeListItem = {
  id: string
  title: string | null
  score: number | null
  updated_at: string
}

type ResumeDetailPayload = {
  resume?: {
    data?: unknown
  }
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

  const experience = (payload.experience || []).map((entry) => {
    const bullets = Array.isArray(entry.bullets)
      ? entry.bullets.map((bullet) => bullet.trim()).filter(Boolean)
      : []
    const bulletText = bullets.length > 0 ? bullets.join(' | ') : (entry.description || '')

    return `${entry.title || ''} at ${entry.company || ''} (${entry.period || ''}) ${bulletText}`
  })

  return [...base, ...experience].filter(Boolean).join('\n')
}

function timeAgo(dateValue: string): string {
  const date = new Date(dateValue)
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export default function ResumesPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'az'>('newest')
  const [analyzingResumeId, setAnalyzingResumeId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('Upgrade to Pro for unlimited AI analysis.')

  useEffect(() => {
    let cancelled = false

    async function loadResumes() {
      const response = await fetch('/api/resumes', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        if (!cancelled) setResumes([])
        return
      }

      const payload = (await response.json()) as { resumes?: ResumeListItem[] }
      if (!cancelled) setResumes(payload.resumes || [])
    }

    loadResumes()

    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = (resumeId: string) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      startTransition(async () => {
        const response = await fetch(`/api/resumes?id=${encodeURIComponent(resumeId)}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setResumes((prev) => prev.filter((resume) => resume.id !== resumeId))
        } else {
          alert('Failed to delete resume. See console for details.')
          try {
            const payload = (await response.json()) as { error?: string }
            console.error(payload.error || 'Delete failed')
          } catch {
            console.error('Delete failed')
          }
        }
      })
    }
  }

  const handleAnalyze = async (resumeId: string) => {
    setActionError('')
    setAnalyzingResumeId(resumeId)

    try {
      const detailResponse = await fetch(`/api/resumes/${resumeId}`, { cache: 'no-store' })
      const detailPayload = (await detailResponse.json()) as ResumeDetailPayload & { error?: string }

      if (!detailResponse.ok) {
        setActionError(detailPayload.error || 'Could not load resume details for analysis.')
        return
      }

      const resumeText = extractResumeText(detailPayload.resume?.data)
      if (!resumeText.trim()) {
        setActionError('Selected resume has no content to analyze.')
        return
      }

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          resumeId,
        }),
      })

      const analyzePayload = (await analyzeResponse.json()) as {
        error?: string
        showUpgrade?: boolean
        reviewId?: string
      }

      if (!analyzeResponse.ok) {
        if (analyzePayload.showUpgrade) {
          setUpgradeMessage(analyzePayload.error || 'This action requires Pro access.')
          setShowUpgradeModal(true)
          return
        }

        setActionError(analyzePayload.error || 'Failed to analyze resume.')
        return
      }

      if (!analyzePayload.reviewId) {
        setActionError('Analysis succeeded but review id is missing.')
        return
      }

      router.push(`/ai-review/${analyzePayload.reviewId}`)
    } catch (error) {
      setActionError((error as Error).message)
    } finally {
      setAnalyzingResumeId(null)
    }
  }

  const visibleResumes = useMemo(() => {
    const filtered = resumes.filter((resume) =>
      (resume.title || 'Untitled Resume').toLowerCase().includes(query.toLowerCase())
    )

    if (sortMode === 'az') {
      return [...filtered].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    }

    if (sortMode === 'oldest') {
      return [...filtered].sort(
        (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      )
    }

    return [...filtered].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }, [resumes, query, sortMode])

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />
      
      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Resumes</h1>
            <p className="text-[#FFFFFF]/82">{resumes.length} resumes</p>
          </div>
          <Link href="/resumes/new" className="bg-linear-to-r from-[#0A9548] to-[#04471C] text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create Resume
          </Link>
        </div>

        <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-3xl">
            <Search className="w-4 h-4 text-[#FFFFFF]/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resumes..."
              className="w-full rounded-lg border border-white/10 bg-[#0A0F0D] py-2 pl-10 pr-3 text-sm text-white focus:border-[#16DB65] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button onClick={() => setSortMode('newest')} className={`px-3 py-1.5 rounded-md ${sortMode === 'newest' ? 'bg-[#0A9548]/20 text-[#0A9548]' : 'text-[#FFFFFF]/82'}`}>Newest</button>
            <button onClick={() => setSortMode('oldest')} className={`px-3 py-1.5 rounded-md ${sortMode === 'oldest' ? 'bg-[#0A9548]/20 text-[#0A9548]' : 'text-[#FFFFFF]/82'}`}>Oldest</button>
            <button onClick={() => setSortMode('az')} className={`px-3 py-1.5 rounded-md ${sortMode === 'az' ? 'bg-[#0A9548]/20 text-[#0A9548]' : 'text-[#FFFFFF]/82'}`}>A-Z</button>
          </div>
        </div>

        {actionError ? (
          <div className="mb-4 rounded-lg border border-[#16DB65]/30 bg-[#0A9548]/12 px-3 py-2 text-sm text-[#16DB65]">
            {actionError}
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-[#0A0F0D] overflow-hidden">
          {visibleResumes.length === 0 ? (
            <div className="p-10 text-center text-[#FFFFFF]/82">
              <p>No resumes found.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#0A9548]">
              {visibleResumes.map((resume) => (
                <div key={resume.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[#0A0F0D] transition-colors">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{resume.title || 'Untitled'}</p>
                    <p className="text-xs text-[#FFFFFF]/60">Updated {new Date(resume.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${Number(resume.score || 0) >= 80 ? 'bg-[#0A9548]/10 text-[#16DB65]' : 'bg-[#16DB65]/10 text-[#16DB65]'}`}>
                      {Number(resume.score || 0)}
                    </span>
                    <span className="text-xs text-[#FFFFFF]/82 hidden md:flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {timeAgo(resume.updated_at)}</span>
                    <button
                      onClick={() => void handleAnalyze(resume.id)}
                      disabled={Boolean(analyzingResumeId) || isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-[#16DB65]/35 bg-[#16DB65]/10 px-2 py-1 text-xs font-semibold text-[#16DB65] hover:bg-[#16DB65]/15 disabled:opacity-55"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {analyzingResumeId === resume.id ? 'Analyzing...' : 'Analyze'}
                    </button>
                    <Link href={`/resumes/${resume.id}`} className="text-[#FFFFFF]/82 hover:text-white"><Eye className="w-4 h-4" /></Link>
                    <Link href={`/resumes/${resume.id}`} className="text-[#FFFFFF]/82 hover:text-white"><Edit className="w-4 h-4" /></Link>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      disabled={isPending}
                      className="text-[#16DB65] hover:text-[#16DB65] disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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


