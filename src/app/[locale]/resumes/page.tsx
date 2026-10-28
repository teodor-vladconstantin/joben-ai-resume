"use client"

import { AppNav } from '@/components/shell/AppNav'
import { buttonVariants } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/Table'
import { Link } from '@/i18n/navigation'
import { Plus, Clock3, Trash2, Edit, Eye, Search, FileText } from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/time-ago'
import { TourLauncher } from '@/components/onboarding/TourLauncher'

type ResumeListItem = {
  id: string
  title: string | null
  score: number | null
  updated_at: string
}

export default function ResumesPage() {
  const t = useTranslations('ResumesPage')
  const [isPending, startTransition] = useTransition()
  const locale = useLocale()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  // 'loading' used to render as "0 resumes / none found" for a few seconds,
  // and a failed fetch looked identical to having no resumes.
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading')
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
        if (!cancelled) setLoadState('error')
        return
      }

      const payload = (await response.json()) as { resumes?: ResumeListItem[]; data?: { resumes?: ResumeListItem[] } }
      if (!cancelled) {
        setResumes(payload.data?.resumes || payload.resumes || [])
        setLoadState('ready')
      }
    }

    loadResumes().catch(() => {
      if (!cancelled) setLoadState('error')
    })

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
          toast.error(t('deleteFailedAlert'))
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
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="grow pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div>
              <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t('title')}</h1>
              <p className="text-muted-foreground">{loadState === 'ready' ? t('resumeCount', { count: resumes.length }) : ' '}</p>
            </div>
            <Link href="/resumes/new" data-tour="resumes-create" className={`w-full justify-center sm:w-auto ${buttonVariants('primary', 'md')}`}>
              <Plus className="size-4" /> {t('createResume')}
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card shadow-card">
            <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1 text-sm">
                {([['newest', t('sortNewest')], ['oldest', t('sortOldest')], ['az', t('sortAZ')]] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`rounded-md px-3 py-1.5 font-medium transition-colors ${sortMode === mode ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loadState === 'loading' ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t('loading')}</p>
            ) : loadState === 'error' ? (
              <p className="px-4 py-10 text-center text-sm text-foreground">{t('loadFailed')}</p>
            ) : visibleResumes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t('noResumesFound')}
                action={
                  <Link href="/resumes/new" className={buttonVariants('primary', 'sm')}>
                    <Plus className="size-4" /> {t('createResume')}
                  </Link>
                }
              />
            ) : (
              <Table>
                <TableBody>
                  {visibleResumes.map((resume, index) => (
                    <TableRow key={resume.id} data-tour={index === 0 ? 'resumes-row' : undefined}>
                      <TableCell>
                        <Link href={`/resumes/${resume.id}`} className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                            <FileText className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">{resume.title || t('untitled')}</span>
                            <span className="block text-xs text-muted-foreground">{t('updatedPrefix')}{new Date(resume.updated_at).toLocaleDateString(locale)}</span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                        <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {timeAgo(resume.updated_at, locale)}</span>
                      </TableCell>
                      <TableCell className="w-16 text-right font-medium tabular-nums text-foreground">{Number(resume.score || 0)}</TableCell>
                      <TableCell className="w-32">
                        <div data-tour={index === 0 ? 'resumes-actions' : undefined} className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Link href={`/resumes/${resume.id}`} className="rounded-md p-2 hover:bg-muted hover:text-foreground"><Eye className="size-4" /></Link>
                          <Link href={`/resumes/${resume.id}`} className="rounded-md p-2 hover:bg-muted hover:text-foreground"><Edit className="size-4" /></Link>
                          <button
                            onClick={() => handleDelete(resume.id)}
                            disabled={isPending}
                            className="rounded-md p-2 hover:bg-muted hover:text-foreground disabled:opacity-30"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <TourLauncher tourId="resumes" />
        </main>
      </div>
    </div>
  )
}
