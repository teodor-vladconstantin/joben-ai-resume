"use client"

import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { buttonVariants } from '@/components/ui/Button'
import Link from 'next/link'
import { Plus, Clock3, Trash2, Edit, Eye, Search } from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { timeAgo } from '@/lib/time-ago'

type CoverLetterItem = {
  id: string
  title: string | null
  updated_at: string
}

export default function CoverLettersPage() {
  const [letters, setLetters] = useState<CoverLetterItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'az'>('newest')

  useEffect(() => {
    let cancelled = false

    async function loadLetters() {
      const response = await fetch('/api/cover-letters', { cache: 'no-store' })
      if (!response.ok) {
        if (!cancelled) setLetters([])
        return
      }

      const payload = (await response.json()) as { letters?: CoverLetterItem[]; data?: { letters?: CoverLetterItem[] } }
      if (!cancelled) setLetters(payload.data?.letters || payload.letters || [])
    }

    loadLetters()

    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = (id: string) => {
    if (!confirm('Delete this cover letter?')) return

    startTransition(async () => {
      const response = await fetch(`/api/cover-letters/${id}`, { method: 'DELETE' })
      if (!response.ok) return
      setLetters((prev) => prev.filter((item) => item.id !== id))
    })
  }

  const visibleLetters = useMemo(() => {
    const filtered = letters.filter((letter) =>
      (letter.title || 'Untitled Cover Letter').toLowerCase().includes(query.toLowerCase())
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
  }, [letters, query, sortMode])

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-7">
            <div>
              <h1 className="text-3xl font-bold text-(--foreground) mb-2">Cover Letters</h1>
              <p className="text-(--muted)">{letters.length} cover letters</p>
            </div>
            <Link href="/cover-letters/new" className={`w-full justify-center sm:w-auto ${buttonVariants('primary', 'md')}`}>
              <Plus className="w-5 h-5" /> Create Cover Letter
            </Link>
          </div>

          <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-3xl">
              <Search className="w-4 h-4 text-(--muted) absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cover letters..."
                className="w-full rounded-lg border border-(--border) bg-(--surface) py-2 pl-10 pr-3 text-sm text-(--foreground) focus:border-(--accent) focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button onClick={() => setSortMode('newest')} className={`px-3 py-1.5 rounded-md ${sortMode === 'newest' ? 'bg-(--accent-muted) text-(--accent)' : 'text-(--muted)'}`}>Newest</button>
              <button onClick={() => setSortMode('oldest')} className={`px-3 py-1.5 rounded-md ${sortMode === 'oldest' ? 'bg-(--accent-muted) text-(--accent)' : 'text-(--muted)'}`}>Oldest</button>
              <button onClick={() => setSortMode('az')} className={`px-3 py-1.5 rounded-md ${sortMode === 'az' ? 'bg-(--accent-muted) text-(--accent)' : 'text-(--muted)'}`}>A-Z</button>
            </div>
          </div>

          <div className="rounded-2xl border border-(--border) bg-(--surface) overflow-hidden">
            {visibleLetters.length === 0 ? (
              <div className="p-10 text-center text-(--muted)">
                <p>No cover letters found.</p>
              </div>
            ) : (
              <div className="divide-y divide-(--border)">
                {visibleLetters.map((letter) => (
                  <div key={letter.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-(--surface-elevated) transition-colors">
                    <div className="min-w-0">
                      <p className="text-(--foreground) font-semibold truncate">{letter.title || 'Untitled Cover Letter'}</p>
                      <p className="text-xs text-(--muted)">Updated {new Date(letter.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold px-2 py-1 rounded bg-(--accent-muted) text-(--accent)">CL</span>
                      <span className="text-xs text-(--muted) hidden md:flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {timeAgo(letter.updated_at)}</span>
                      <Link href={`/cover-letters/${letter.id}`} className="text-(--muted) hover:text-(--foreground)"><Eye className="w-4 h-4" /></Link>
                      <Link href={`/cover-letters/${letter.id}`} className="text-(--muted) hover:text-(--foreground)"><Edit className="w-4 h-4" /></Link>
                      <button
                        onClick={() => handleDelete(letter.id)}
                        disabled={isPending}
                        className="text-(--accent-strong) disabled:opacity-50"
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
      </div>
    </div>
  )
}
