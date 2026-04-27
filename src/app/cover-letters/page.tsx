"use client"

import { Navbar } from '@/components/ui/Navbar'
import Link from 'next/link'
import { Plus, Clock3, Trash2, Edit, Eye, Search } from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'

type CoverLetterItem = {
  id: string
  title: string | null
  updated_at: string
}

function timeAgo(dateValue: string): string {
  const date = new Date(dateValue)
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' years ago'
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' months ago'
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' days ago'
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' hours ago'
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' minutes ago'
  return Math.floor(seconds) + ' seconds ago'
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
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />
      
      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-7">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Cover Letters</h1>
            <p className="text-[#FFFFFF]/82">{letters.length} cover letters</p>
          </div>
          <Link href="/cover-letters/new" className="bg-linear-to-r from-[#0A9548] to-[#04471C] text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" /> Create Cover Letter
          </Link>
        </div>

        <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-3xl">
            <Search className="w-4 h-4 text-[#FFFFFF]/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cover letters..."
              className="w-full rounded-lg border border-white/10 bg-[#0A0F0D] py-2 pl-10 pr-3 text-sm text-white focus:border-[#16DB65] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button onClick={() => setSortMode('newest')} className={`px-3 py-1.5 rounded-md ${sortMode === 'newest' ? 'bg-[#0A9548]/20 text-[#0A9548]' : 'text-[#FFFFFF]/82'}`}>Newest</button>
            <button onClick={() => setSortMode('oldest')} className={`px-3 py-1.5 rounded-md ${sortMode === 'oldest' ? 'bg-[#0A9548]/20 text-[#0A9548]' : 'text-[#FFFFFF]/82'}`}>Oldest</button>
            <button onClick={() => setSortMode('az')} className={`px-3 py-1.5 rounded-md ${sortMode === 'az' ? 'bg-[#0A9548]/20 text-[#0A9548]' : 'text-[#FFFFFF]/82'}`}>A-Z</button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0A0F0D] overflow-hidden">
          {visibleLetters.length === 0 ? (
            <div className="p-10 text-center text-[#FFFFFF]/82">
              <p>No cover letters found.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#0A9548]">
              {visibleLetters.map((letter) => (
                <div key={letter.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[#0A0F0D] transition-colors">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{letter.title || 'Untitled Cover Letter'}</p>
                    <p className="text-xs text-[#FFFFFF]/60">Updated {new Date(letter.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-[#0A9548]/10 text-[#16DB65]">CL</span>
                    <span className="text-xs text-[#FFFFFF]/82 hidden md:flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {timeAgo(letter.updated_at)}</span>
                    <Link href={`/cover-letters/${letter.id}`} className="text-[#FFFFFF]/82 hover:text-white"><Eye className="w-4 h-4" /></Link>
                    <Link href={`/cover-letters/${letter.id}`} className="text-[#FFFFFF]/82 hover:text-white"><Edit className="w-4 h-4" /></Link>
                    <button
                      onClick={() => handleDelete(letter.id)}
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
    </div>
  )
}


