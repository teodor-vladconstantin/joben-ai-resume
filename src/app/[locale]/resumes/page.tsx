"use client"

import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { buttonVariants } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Link } from '@/i18n/navigation'
import { Plus, Clock3, Trash2, Edit, Eye, Search, ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { timeAgo } from '@/lib/time-ago'

type ResumeListItem = {
  id: string
  title: string | null
  score: number | null
  updated_at: string
}

export default function ResumesPage() {
  const t = useTranslations('ResumesPage')
  const [isPending, startTransition] = useTransition()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'az'>('newest')

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

      const payload = (await response.json()) as { resumes?: ResumeListItem[]; data?: { resumes?: ResumeListItem[] } }
      if (!cancelled) setResumes(payload.data?.resumes || payload.resumes || [])
    }

    loadResumes()

    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = (resumeId: string) => {
    if (confirm(t('deleteConfirm'))) {
      startTransition(async () => {
        const response = await fetch(`/api/resumes?id=${encodeURIComponent(resumeId)}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setResumes((prev) => prev.filter((resume) => resume.id !== resumeId))
        } else {
          alert(t('deleteFailedAlert'))
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


  const visibleResumes = useMemo(() => {
    const filtered = resumes.filter((resume) =>
      (resume.title || t('untitledSearchFallback')).toLowerCase().includes(query.toLowerCase())
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
  }, [resumes, query, sortMode, t])

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-7">
            <div>
              <h1 className="text-3xl font-bold text-(--foreground) mb-2">{t('title')}</h1>
              <p className="text-(--muted)">{t('resumeCount', { count: resumes.length })}</p>
            </div>
            <Link href="/resumes/new" className={`w-full justify-center sm:w-auto ${buttonVariants('primary', 'md')}`}>
              <Plus className="w-5 h-5" /> {t('createResume')}
            </Link>
          </div>

          <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-3xl">
              <Search className="w-4 h-4 text-(--muted) absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-sm border border-(--border) bg-(--surface) py-2 pl-10 pr-3 text-sm text-(--foreground) transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button onClick={() => setSortMode('newest')} className={`px-3 py-1.5 border-b transition-colors duration-150 ease-out ${sortMode === 'newest' ? 'border-(--accent) text-(--foreground)' : 'border-transparent text-(--muted)'}`}>{t('sortNewest')}</button>
              <button onClick={() => setSortMode('oldest')} className={`px-3 py-1.5 border-b transition-colors duration-150 ease-out ${sortMode === 'oldest' ? 'border-(--accent) text-(--foreground)' : 'border-transparent text-(--muted)'}`}>{t('sortOldest')}</button>
              <button onClick={() => setSortMode('az')} className={`px-3 py-1.5 border-b transition-colors duration-150 ease-out ${sortMode === 'az' ? 'border-(--accent) text-(--foreground)' : 'border-transparent text-(--muted)'}`}>{t('sortAZ')}</button>
            </div>
          </div>


          <div className="border border-(--border) bg-(--surface)">
            {visibleResumes.length === 0 ? (
              <EmptyState
                title={t('noResumesFound')}
                action={
                  <Link href="/resumes/new" className={buttonVariants('secondary', 'sm')}>
                    <Plus className="w-4 h-4" /> {t('createResume')}
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-(--border)">
                {visibleResumes.map((resume) => (
                  <div key={resume.id} className="row-invert flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{resume.title || t('untitled')}</p>
                      <p className="text-xs opacity-70">{t('updatedPrefix')}{new Date(resume.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs font-bold tabular-nums">
                        {Number(resume.score || 0)}
                      </span>
                      <span className="text-xs opacity-70 hidden md:flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {timeAgo(resume.updated_at)}</span>
                      <Link href={`/resumes/${resume.id}`} className="opacity-70 hover:opacity-100 transition-opacity duration-150 ease-out"><Eye className="w-4 h-4" /></Link>
                      <Link href={`/resumes/${resume.id}`} className="opacity-70 hover:opacity-100 transition-opacity duration-150 ease-out"><Edit className="w-4 h-4" /></Link>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        disabled={isPending}
                        className="opacity-70 hover:opacity-100 disabled:opacity-30 transition-opacity duration-150 ease-out"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ArrowRight className="row-invert-arrow h-4 w-4 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
