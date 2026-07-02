# ResuMax-Style Redesign — Phase 5: Cover Letters + AI Review — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `/cover-letters` (list + `CoverLetterBuilder` editor) and `/ai-review` (landing + `[id]` report + `ResumeAnalyzer`) onto the Phase 0-4 token system and `Modal` primitive, with zero change to data-fetching/autosave/AI-action/export logic.

**Architecture:** `/cover-letters` and `/ai-review` (landing + detail) adopt the `Sidebar` layout (Phase 3 pattern). `CoverLetterBuilder` keeps its `Navbar`-only full-width shell (Phase 4's `ResumeBuilder` precedent). 4 modal-shaped UI elements (`ParagraphModal`, `CoverLetterBuilder`'s inline "Edit Section" modal, `ai-review/[id]`'s inline "Auto-fix unavailable" modal) migrate onto the `Modal` primitive from Phase 4; `UpgradeModal` is already on it and is inherited automatically by both features.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind v4 (CSS-var arbitrary-value syntax), lucide-react icons.

## Global Constraints

- Restyle only: every task changes `className`/style values and, where explicitly called out as a bundled bug fix, a color-only Tailwind class — never a prop, handler, state variable, or data-fetch call.
- Color-only edits on files over ~150 lines: only `bg-*`, `text-*`, `border-*`, `from-*`/`to-*`, `divide-*` classes change. `rounded-*` and spacing classes are untouched (Phase 3/4 precedent).
- Token mapping (established Phase 0-4, extends the table from `docs/superpowers/plans/2026-07-02-resumax-style-phase4-builder.md`):
  - `#0A0F0D`, `bg-[#111]` → `bg-(--surface)`; `#020202` → `bg-(--background)`
  - `text-white`, `/95`, `/88` → `text-(--foreground)`; `text-[#FFFFFF]/82,/78,/72,/60`, `text-white/50,/40` → `text-(--muted)`
  - `border-white/10,/12,/20,/30` → `border-(--border)`
  - `#0A9548` solid → `text-(--accent)`/`border-(--accent)`; translucent `bg-[#0A9548]/NN` → `bg-(--accent-muted)` or `bg-(--accent)/NN` (matching the source alpha)
  - `#16DB65` → `text-(--accent-strong)`/`border-(--accent-strong)` **except** where it colors genuine error/failure text (see per-task bug-fix notes) — those go to `text-red-400`
  - `bg-linear-to-r from-[#0A9548] to-[#04471C]` primary CTA gradients → `buttonVariants('primary', size)` from `@/components/ui/Button`
  - **New this phase — `ResumeAnalyzer.tsx`'s `scoreColor()`/`categoryColor()` functions**: a genuine 4-tier semantic color system (`#16DB65` excellent / `#84CC16` good / `#F97316` fair / `#EF4444` poor) driving a data-dependent ring/bar color, not a static dark-theme surface color. Left as literal hex, completely untouched — same category as `amber-300` credit-warning text (Phase 4) and `scoreColor`'s existing values are not part of the dark-palette hex inventory being tokenized.
  - **New this phase — "weak/current vs strong/suggested" example pairs** (`ResumeAnalyzer.tsx`'s Priority Improvements cards): same shape as Phase 4's `BeforeAfterModal` Before/After treatment — weak/current text → `text-(--foreground)` (neutral), strong/suggested text → `text-(--accent)` (positive), matching that established precedent exactly.
  - Existing `red-400`/`text-[#EF4444]` semantic red (score decline, priority-improvements heading) and `amber-300` are already-correct literal colors, left untouched except where explicitly re-pointed to `text-red-400` for consistency (see Task 5).
- After every task: `npx tsc --noEmit` must pass with no new errors.
- After every task: live Playwright verification against the already-seeded local session + **explicit user confirmation before starting the next task**.

---

### Task 1: Restyle `/cover-letters` (list page)

**Files:**
- Modify: `src/app/cover-letters/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `Sidebar` (Phase 3, `@/components/dashboard/Sidebar`), `buttonVariants` (Phase 0, `@/components/ui/Button`).

- [ ] **Step 1: Replace the file content**

```tsx
"use client"

import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { buttonVariants } from '@/components/ui/Button'
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
```

Implementer notes (bundled bug fixes — same 3 bugs as `resumes/page.tsx` had pre-Phase-4, since this file was originally copy-pasted from the same source):
- `divide-y divide-[#0A9548]` (solid accent as row divider) → `divide-(--border)`.
- Delete button `text-[#16DB65] hover:text-[#16DB65]` (no-op hover) → collapsed to static `text-(--accent-strong)`.
- List-row `hover:bg-[#0A0F0D]` (identical to resting bg, no-op) → `hover:bg-(--surface-elevated)`.
- All fetch/delete/sort/search logic byte-for-byte unchanged.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/app/cover-letters/page.tsx
git commit -m "feat(cover-letters): adopt Sidebar layout and restyle list with tokens"
```

---

### Task 2: Restyle `CoverLetterBuilder.tsx` shell and form content

**Files:**
- Modify: `src/components/cover-letter/CoverLetterBuilder.tsx` (full replacement)

**Interfaces:** none new. `SectionList`, `ParagraphModal`, `UpgradeModal`, `FeatureButton` consumed with identical props. Every handler (`persistLetter`, `openSectionEditor`, `applyModalChanges`, `generateDraft`, `exportAsPdf`) and every piece of state is byte-for-byte unchanged — this task only changes `className` values (plus the two documented decorative-gradient decisions below) and adds one import.

- [ ] **Step 1: Replace the file content**

```tsx
"use client"
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Save, Download, Play, Building2, Briefcase, Sparkles } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { SectionList } from '@/components/cover-letter/SectionList'
import { ParagraphModal } from '@/components/cover-letter/ParagraphModal'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { FeatureButton } from '@/components/FeatureButton'
import { buttonVariants } from '@/components/ui/Button'
import { startProCheckout } from '@/lib/client-billing'

type CoverLetterSections = {
  headerName: string
  headerEmail: string
  headerPhone: string
  date: string
  recipientName: string
  recipientTitle: string
  company: string
  position: string
  salutation: string
  introduction: string
  bodyParagraphs: string[]
  conclusion: string
  closingSignature: string
  tone: 'formal' | 'professional' | 'conversational'
}

type TextModalId =
  | 'header'
  | 'date'
  | 'recipient'
  | 'position'
  | 'salutation'
  | 'introduction'
  | 'conclusion'
  | 'closing'

const defaultSections: CoverLetterSections = {
  headerName: 'Your Name',
  headerEmail: 'you@example.com',
  headerPhone: '+1 (555) 000-0000',
  date: '',
  recipientName: '',
  recipientTitle: '',
  company: '',
  position: '',
  salutation: 'Dear Hiring Manager,',
  introduction:
    'I am writing to express my strong interest in this role. With my background in software development, I am confident I can contribute from day one.',
  bodyParagraphs: [
    'In recent roles, I delivered measurable impact, collaborated across teams, and maintained high standards for quality and execution.',
  ],
  conclusion:
    'I would welcome the opportunity to discuss how my experience aligns with your team needs.',
  closingSignature: 'Sincerely,\nYour Name',
  tone: 'professional',
}

function serializeSections(sections: CoverLetterSections) {
  return JSON.stringify({ version: 1, sections })
}

function parseSections(content: string): CoverLetterSections {
  try {
    const parsed = JSON.parse(content) as { sections?: Partial<CoverLetterSections> }
    if (parsed.sections) {
      return {
        ...defaultSections,
        ...parsed.sections,
        bodyParagraphs:
          parsed.sections.bodyParagraphs && parsed.sections.bodyParagraphs.length > 0
            ? parsed.sections.bodyParagraphs
            : defaultSections.bodyParagraphs,
      }
    }
  } catch {
    return {
      ...defaultSections,
      introduction: content || defaultSections.introduction,
    }
  }

  return defaultSections
}

function toResumeLikeText(sections: CoverLetterSections) {
  return [
    sections.headerName,
    sections.position,
    sections.introduction,
    ...sections.bodyParagraphs,
    sections.conclusion,
  ]
    .filter(Boolean)
    .join('\n')
}

export function CoverLetterBuilder() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const routeId = params?.id
  const isCreateMode = routeId === 'new' || !routeId

  const [sections, setSections] = useState<CoverLetterSections>(defaultSections)
  const [jobDescription, setJobDescription] = useState('')
  const [activeModal, setActiveModal] = useState<TextModalId | null>(null)
  const [isBodyModalOpen, setIsBodyModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [letterId, setLetterId] = useState<string | null>(null)
  const [modalDraft, setModalDraft] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('Unlock unlimited AI cover letter generation with Pro.')

  const computedTitle = useMemo(() => {
    if (sections.company && sections.position) return `${sections.company} - ${sections.position}`
    if (sections.company) return sections.company
    if (sections.position) return sections.position
    return 'Untitled Cover Letter'
  }, [sections.company, sections.position])

  const sectionItems = useMemo(() => {
    return [
      { id: 'header', label: 'Header Information', completed: !!sections.headerName && !!sections.headerEmail },
      { id: 'date', label: 'Date', completed: !!sections.date },
      { id: 'recipient', label: 'Recipient', completed: !!sections.recipientName },
      { id: 'position', label: 'Position', completed: !!sections.position && !!sections.company },
      { id: 'salutation', label: 'Salutation', completed: !!sections.salutation },
      { id: 'introduction', label: 'Introduction', completed: sections.introduction.trim().length > 0 },
      {
        id: 'body',
        label: `Body Paragraphs (${sections.bodyParagraphs.length})`,
        completed: sections.bodyParagraphs.some((p) => p.trim().length > 0),
      },
      { id: 'conclusion', label: 'Conclusion', completed: sections.conclusion.trim().length > 0 },
      { id: 'closing', label: 'Closing & Signature', completed: sections.closingSignature.trim().length > 0 },
    ]
  }, [sections])

  const completedSections = useMemo(
    () => sectionItems.filter((item) => item.completed).length,
    [sectionItems]
  )

  useEffect(() => {
    let cancelled = false

    async function loadLetter() {
      if (isCreateMode) {
        setSections((prev) => ({
          ...prev,
          date: prev.date || new Date().toISOString().slice(0, 10),
        }))
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/cover-letters/${routeId}`, { cache: 'no-store' })
      if (!response.ok) {
        setIsLoading(false)
        return
      }

      const payload = (await response.json()) as {
        letter?: {
          id: string
          title: string
          content: string
        }
        data?: {
          letter?: {
            id: string
            title: string
            content: string
          }
        }
      }

      const letterPayload = payload.data?.letter || payload.letter

      if (cancelled || !letterPayload) {
        setIsLoading(false)
        return
      }

      setLetterId(letterPayload.id)
      setSections(parseSections(letterPayload.content || ''))

      const parts = (letterPayload.title || '').split(' - ')
      if (parts.length >= 2) {
        setSections((prev) => ({
          ...prev,
          company: prev.company || parts[0],
          position: prev.position || parts.slice(1).join(' - '),
        }))
      }

      setIsLoading(false)
    }

    loadLetter()

    return () => {
      cancelled = true
    }
  }, [isCreateMode, routeId])

  const persistLetter = useCallback(async () => {
    setSaveStatus('saving')

    const payload = {
      title: computedTitle,
      content: serializeSections(sections),
    }

    if (!letterId && isCreateMode) {
      const createRes = await fetch('/api/cover-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!createRes.ok) {
        setSaveStatus('error')
        return
      }

      const responsePayload = (await createRes.json()) as { letter?: { id: string } }
      if (responsePayload.letter?.id) {
        setLetterId(responsePayload.letter.id)
        router.replace(`/cover-letters/${responsePayload.letter.id}`)
      }
      setSaveStatus('saved')
      return
    }

    const targetId = letterId || routeId
    if (!targetId || targetId === 'new') {
      setSaveStatus('error')
      return
    }

    const updateRes = await fetch(`/api/cover-letters/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaveStatus(updateRes.ok ? 'saved' : 'error')
  }, [computedTitle, isCreateMode, letterId, routeId, router, sections])

  useEffect(() => {
    if (isLoading) return
    const handle = setTimeout(() => {
      void persistLetter()
    }, 2000)
    return () => clearTimeout(handle)
  }, [isLoading, persistLetter])

  function openSectionEditor(id: string) {
    if (id === 'body') {
      setIsBodyModalOpen(true)
      return
    }

    const modal = id as TextModalId
    setActiveModal(modal)

    if (modal === 'header') {
      setModalDraft(`${sections.headerName}\n${sections.headerEmail}\n${sections.headerPhone}`)
      return
    }

    if (modal === 'date') {
      setModalDraft(sections.date)
      return
    }

    if (modal === 'recipient') {
      setModalDraft(`${sections.recipientName}\n${sections.recipientTitle}`)
      return
    }

    if (modal === 'position') {
      setModalDraft(`${sections.company}\n${sections.position}`)
      return
    }

    if (modal === 'salutation') {
      setModalDraft(sections.salutation)
      return
    }

    if (modal === 'introduction') {
      setModalDraft(sections.introduction)
      return
    }

    if (modal === 'conclusion') {
      setModalDraft(sections.conclusion)
      return
    }

    setModalDraft(sections.closingSignature)
  }

  function applyModalChanges() {
    if (!activeModal) return

    const lines = modalDraft.split('\n')
    if (activeModal === 'header') {
      setSections((prev) => ({
        ...prev,
        headerName: lines[0] || '',
        headerEmail: lines[1] || '',
        headerPhone: lines[2] || '',
      }))
    } else if (activeModal === 'date') {
      setSections((prev) => ({ ...prev, date: modalDraft }))
    } else if (activeModal === 'recipient') {
      setSections((prev) => ({
        ...prev,
        recipientName: lines[0] || '',
        recipientTitle: lines[1] || '',
      }))
    } else if (activeModal === 'position') {
      setSections((prev) => ({
        ...prev,
        company: lines[0] || '',
        position: lines[1] || '',
      }))
    } else if (activeModal === 'salutation') {
      setSections((prev) => ({ ...prev, salutation: modalDraft }))
    } else if (activeModal === 'introduction') {
      setSections((prev) => ({ ...prev, introduction: modalDraft }))
    } else if (activeModal === 'conclusion') {
      setSections((prev) => ({ ...prev, conclusion: modalDraft }))
    } else {
      setSections((prev) => ({ ...prev, closingSignature: modalDraft }))
    }

    setActiveModal(null)
    setModalDraft('')
  }

  async function generateDraft() {
    setIsGenerating(true)

    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: toResumeLikeText(sections),
          company: sections.company,
          position: sections.position,
          jobDescription,
          tone: sections.tone,
        }),
      })

      const payload = (await response.json()) as {
        result?: {
          salutation?: string
          paragraphs?: string[]
          closing?: string
        }
        showUpgrade?: boolean
        error?: string
      }

      if (!response.ok || !payload.result) {
        if (payload.showUpgrade) {
          setUpgradeMessage(payload.error || 'This AI action is available on Pro.')
          setShowUpgradeModal(true)
          setIsGenerating(false)
          return
        }
        alert(payload.error || 'Could not generate draft.')
        setIsGenerating(false)
        return
      }

      const paragraphs = payload.result.paragraphs || []
      const intro = paragraphs[0] || sections.introduction
      const conclusion = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : sections.conclusion
      const body = paragraphs.length > 2 ? paragraphs.slice(1, -1) : paragraphs.slice(1)

      setSections((prev) => ({
        ...prev,
        salutation: payload.result?.salutation || prev.salutation,
        introduction: intro,
        bodyParagraphs: body.length > 0 ? body : prev.bodyParagraphs,
        conclusion,
        closingSignature: payload.result?.closing || prev.closingSignature,
      }))
    } catch (error) {
      alert(`Draft generation failed: ${(error as Error).message}`)
    }

    setIsGenerating(false)
  }

  async function exportAsPdf() {
    if (isExportingPdf) return
    setIsExportingPdf(true)

    try {
      const response = await fetch('/api/cover-letter/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: computedTitle,
          sections,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        alert(payload.error || 'Could not export PDF.')
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${computedTitle.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'cover-letter'}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`Export failed: ${(error as Error).message}`)
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row">
      <div className="w-full lg:w-112.5 bg-(--surface) border-r border-(--border) flex flex-col h-full z-10 shadow-2xl">
        <div className="p-6 border-b border-(--border) bg-linear-to-r from-(--surface-elevated) to-(--surface)">
          <h2 className="text-xl font-bold text-(--foreground) flex items-center gap-2"><Sparkles className="text-(--accent) w-5 h-5"/> Cover Letter Sections</h2>
          <p className="text-sm text-(--muted) mt-2">Progress {completedSections}/{sectionItems.length} complete</p>
          <div className="mt-3 h-2 w-full rounded-full bg-(--background)">
            <div className="h-2 rounded-full bg-(--accent)" style={{ width: `${(completedSections / sectionItems.length) * 100}%` }}></div>
          </div>
        </div>

        <div className="grow p-6 overflow-y-auto">
          <SectionList sections={sectionItems} onSelect={openSectionEditor} />

          <div className="space-y-2 pt-5">
            <label className="text-sm font-medium text-(--muted) flex items-center gap-2"><Building2 className="w-4 h-4 text-(--muted)" /> Company Name</label>
            <input
              value={sections.company}
              onChange={(e) => setSections((prev) => ({ ...prev, company: e.target.value }))}
              type="text"
              className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong)"
              placeholder="e.g., Google"
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-(--muted) flex items-center gap-2"><Briefcase className="w-4 h-4 text-(--muted)" /> Job Title</label>
            <input
              value={sections.position}
              onChange={(e) => setSections((prev) => ({ ...prev, position: e.target.value }))}
              type="text"
              className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong)"
              placeholder="e.g., Senior Frontend Engineer"
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-(--muted) flex items-center gap-2"><FileText className="w-4 h-4 text-(--muted)" /> Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) h-32 resize-none text-sm"
              placeholder="Paste the full job description here..."
            ></textarea>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-(--muted)">Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {(['formal', 'professional', 'conversational'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSections((prev) => ({ ...prev, tone }))}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    sections.tone === tone
                      ? 'border-(--accent)/50 bg-(--accent-muted) text-(--accent)'
                      : 'border-(--border) bg-(--surface) text-(--muted)'
                  }`}
                >
                  {tone[0].toUpperCase() + tone.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <FeatureButton
            feature="covers"
            onClick={generateDraft}
            disabled={isGenerating}
            className={`mt-6 w-full shadow-lg shadow-(--accent)/20 ${buttonVariants('primary', 'md')}`}
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-(--background) border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Generate Draft
              </>
            )}
          </FeatureButton>
        </div>

        <div className="p-4 border-t border-(--border) bg-(--background) flex justify-between items-center gap-4">
          <button
            onClick={() => void persistLetter()}
            disabled={isLoading || saveStatus === 'saving' || isExportingPdf}
            className="flex-1 bg-(--surface) border border-(--border) hover:bg-(--surface-elevated) text-(--foreground) px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          <button
            onClick={() => void exportAsPdf()}
            disabled={isLoading || isExportingPdf}
            className="flex-1 bg-(--surface) border border-(--border) hover:bg-(--surface-elevated) text-(--foreground) px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="grow bg-(--background) h-full flex flex-col p-4 lg:p-8 overflow-hidden relative">
        <div className="w-full max-w-200 h-full bg-white rounded-lg shadow-2xl mx-auto overflow-hidden">
          <div className="h-full overflow-y-auto p-12 text-black font-serif text-[15px] leading-relaxed">
            <div className="mb-8 text-sm text-gray-700">
              <p className="font-semibold">{sections.headerName}</p>
              <p>{sections.headerEmail}</p>
              <p>{sections.headerPhone}</p>
              <p className="mt-4">{sections.date || new Date().toLocaleDateString()}</p>
            </div>

            <div className="mb-6 text-sm text-gray-700">
              {sections.recipientName ? <p>{sections.recipientName}</p> : null}
              {sections.recipientTitle ? <p>{sections.recipientTitle}</p> : null}
              {sections.company ? <p>{sections.company}</p> : null}
            </div>

            <p className="mb-4 whitespace-pre-wrap">{sections.salutation}</p>
            <p className="mb-4 whitespace-pre-wrap">{sections.introduction}</p>
            {sections.bodyParagraphs.map((paragraph, index) => (
              <p key={index} className="mb-4 whitespace-pre-wrap">{paragraph}</p>
            ))}
            <p className="mb-4 whitespace-pre-wrap">{sections.conclusion}</p>
            <p className="whitespace-pre-wrap">{sections.closingSignature}</p>
          </div>
        </div>

        <div className="absolute top-3 right-4 text-xs text-(--muted) bg-black/40 px-2 py-1 rounded">
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Save failed' : 'Idle'}
        </div>
      </div>

      <ParagraphModal
        open={isBodyModalOpen}
        paragraphs={sections.bodyParagraphs}
        onClose={() => setIsBodyModalOpen(false)}
        onChange={(next) => setSections((prev) => ({ ...prev, bodyParagraphs: next }))}
      />

      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-2xl">
            <h3 className="mb-3 text-lg font-bold text-(--foreground)">Edit Section</h3>
            <textarea
              value={modalDraft}
              onChange={(e) => setModalDraft(e.target.value)}
              className="h-52 w-full resize-none rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
            />
            <p className="mt-2 text-xs text-(--muted)">
              Use new lines for multi-field sections like Header, Recipient, and Position.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setActiveModal(null)} className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)">
                Cancel
              </button>
              <button onClick={applyModalChanges} className={buttonVariants('primary', 'md')}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <UpgradeModal
        open={showUpgradeModal}
        title="Upgrade to Continue AI Generation"
        description={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={startProCheckout}
      />
    </div>
  )
}
```

Implementer notes:
- **Decorative gradient decisions** (no direct Phase 0-4 precedent, documented here rather than left ambiguous): the left-panel header banner (`bg-linear-to-r from-[#0D2818] to-[#04471C]`) is a background panel, not a button, so it does not get `buttonVariants` — mapped to `bg-linear-to-r from-(--surface-elevated) to-(--surface)`, reusing only existing tokens rather than inventing a new color pairing. The progress-bar fill (same original gradient) is not a button either — mapped to a flat `bg-(--accent)`, matching Phase 3's `ProfileCompletion` progress-bar precedent exactly.
- **Save vs Export PDF stay visually equal**: unlike `ResumeBuilder` (where Export PDF is the one primary/gradient CTA), this component's original had BOTH buttons using the same plain outline style — preserved exactly as-is (both tokenized to the same `bg-(--surface) border-(--border) hover:bg-(--surface-elevated)` treatment), not unilaterally promoting Export PDF to primary just because the sibling builder did it that way.
- **Generate Draft** was the one true primary-gradient CTA in this file — migrated to `buttonVariants('primary', 'md')`, matching the established rule.
- The inline "Edit Section" modal is tokenized here but **not yet** converted to the `Modal` primitive — that structural swap happens in Task 3, alongside `ParagraphModal`.
- **Observation, not fixed**: the live-preview wrapper (`<div className="grow bg-(--background) h-full flex flex-col p-4 lg:p-8 overflow-hidden relative">`) was missing `relative` in the original, which the absolutely-positioned save-status badge depends on for correct positioning. Added `relative` here since it's required for the badge to render in the right place at all (a pre-existing layout bug, not a color choice) — flag this explicitly to the user as a deviation from pure color-only edits, since Global Constraints normally forbid non-color changes; this one line is the exception and is called out rather than silently slipped in.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/components/cover-letter/CoverLetterBuilder.tsx
git commit -m "feat(cover-letter): restyle CoverLetterBuilder shell and form content with tokens"
```

---

### Task 3: Migrate `ParagraphModal` + inline "Edit Section" modal onto `Modal`; restyle `SectionList`

**Files:**
- Modify: `src/components/cover-letter/ParagraphModal.tsx` (full replacement)
- Modify: `src/components/cover-letter/SectionList.tsx` (full replacement)
- Modify: `src/components/cover-letter/CoverLetterBuilder.tsx` (one region — the inline "Edit Section" modal block)

**Interfaces:** none new. `ParagraphModal`'s props (`open`, `paragraphs`, `onClose`, `onChange`) and `SectionList`'s props (`sections`, `onSelect`) unchanged.

- [ ] **Step 1: Replace `ParagraphModal.tsx`**

```tsx
"use client"

import { Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'

type ParagraphModalProps = {
  open: boolean
  paragraphs: string[]
  onClose: () => void
  onChange: (next: string[]) => void
}

export function ParagraphModal({ open, paragraphs, onClose, onChange }: ParagraphModalProps) {
  const updateParagraph = (index: number, value: string) => {
    const next = [...paragraphs]
    next[index] = value
    onChange(next)
  }

  const addParagraph = () => {
    onChange([...paragraphs, ''])
  }

  const removeParagraph = (index: number) => {
    const next = paragraphs.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [''])
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Body Paragraphs"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={addParagraph}
            className="rounded-lg border border-(--accent)/30 bg-(--accent-muted) px-3 py-2 text-sm font-semibold text-(--accent) hover:bg-(--accent)/20"
          >
            + Add Paragraph
          </button>
          <button onClick={onClose} className={buttonVariants('primary', 'md')}>
            Save Changes
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {paragraphs.map((paragraph, index) => (
          <div key={index} className="rounded-xl border border-(--border) bg-(--surface) p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-(--foreground)">Paragraph {index + 1}</p>
              <button
                onClick={() => removeParagraph(index)}
                className="rounded-md border border-(--accent-strong)/30 bg-(--accent-muted) p-1 text-(--accent-strong) hover:bg-(--accent)/18"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={paragraph}
              onChange={(e) => updateParagraph(index, e.target.value)}
              className="h-24 w-full resize-none rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
            />
          </div>
        ))}
      </div>
    </Modal>
  )
}
```

Implementer note: the original wrapped its paragraph list in `max-h-[60vh] overflow-y-auto pr-1` to manage its own scroll; the `Modal` primitive's body (`min-h-0 grow overflow-y-auto`) already scrolls, so that wrapper is dropped rather than nested redundantly — matches the pattern already used migrating `AddContentModal`/`BeforeAfterModal` in Phase 4.

- [ ] **Step 2: Replace `SectionList.tsx`**

```tsx
"use client"

type SectionItem = {
  id: string
  label: string
  completed: boolean
}

type SectionListProps = {
  sections: SectionItem[]
  onSelect: (id: string) => void
}

export function SectionList({ sections, onSelect }: SectionListProps) {
  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSelect(section.id)}
          className="w-full rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-left hover:border-(--accent-strong)/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-(--foreground)">{section.label}</span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${section.completed ? 'bg-(--accent)' : 'bg-(--border)'}`}
              aria-hidden
            />
          </div>
        </button>
      ))}
    </div>
  )
}
```

Implementer note: the original's "incomplete" dot was a standalone gray (`#374151`) not derived from any established token; mapped to `bg-(--border)`, consistent with how other "inactive/incomplete" indicators map to the border token elsewhere in this redesign.

- [ ] **Step 3: Migrate the inline "Edit Section" modal in `CoverLetterBuilder.tsx` onto `Modal`**

Read `src/components/cover-letter/CoverLetterBuilder.tsx` to confirm current line numbers for the `{activeModal ? (` block (added in Task 2).

Find this exact block:

```tsx
      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-2xl">
            <h3 className="mb-3 text-lg font-bold text-(--foreground)">Edit Section</h3>
            <textarea
              value={modalDraft}
              onChange={(e) => setModalDraft(e.target.value)}
              className="h-52 w-full resize-none rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
            />
            <p className="mt-2 text-xs text-(--muted)">
              Use new lines for multi-field sections like Header, Recipient, and Position.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setActiveModal(null)} className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)">
                Cancel
              </button>
              <button onClick={applyModalChanges} className={buttonVariants('primary', 'md')}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
```

Replace with:

```tsx
      <Modal
        open={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title="Edit Section"
        maxWidth="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setActiveModal(null)} className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)">
              Cancel
            </button>
            <button onClick={applyModalChanges} className={buttonVariants('primary', 'md')}>
              Save Changes
            </button>
          </div>
        }
      >
        <textarea
          value={modalDraft}
          onChange={(e) => setModalDraft(e.target.value)}
          className="h-52 w-full resize-none rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
        />
        <p className="mt-2 text-xs text-(--muted)">
          Use new lines for multi-field sections like Header, Recipient, and Position.
        </p>
      </Modal>
```

Add `import { Modal } from '@/components/ui/Modal'` to `CoverLetterBuilder.tsx`'s import block.

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 5: Commit**

```bash
git add src/components/cover-letter/ParagraphModal.tsx src/components/cover-letter/SectionList.tsx src/components/cover-letter/CoverLetterBuilder.tsx
git commit -m "feat(cover-letter): migrate ParagraphModal + inline Edit Section modal onto Modal primitive; restyle SectionList"
```

---

### Task 4: Restyle `/ai-review` (landing page)

**Files:**
- Modify: `src/app/ai-review/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `Sidebar` (Phase 3), `buttonVariants` (Phase 0), `UpgradeModal` (already on `Modal` since Phase 4 — no changes needed there).

- [ ] **Step 1: Replace the file content**

```tsx
"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { buttonVariants } from '@/components/ui/Button'
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
      setError('Only PDF files are supported at the moment.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('PDF must be under 10 MB.')
      return
    }

    setIsProcessingUpload(true)

    try {
      const result = await importPdfClientSide(file)
      const text = extractResumeText(result.data)

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

        const detail = (await detailRes.json()) as { resume?: { data?: unknown }; data?: { resume?: { data?: unknown } } }
        resumeText = extractResumeText(detail.data?.resume?.data ?? detail.resume?.data)
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
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-(--foreground) mb-2">AI Resume Review</h1>
            <p className="text-(--muted)">Get instant AI-powered feedback across 5 key categories.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
              <p className="text-xs text-(--muted) flex items-center gap-2"><Target className="w-4 h-4 text-(--accent-strong)" /> Target Score</p>
              <p className="text-3xl font-black text-(--foreground) mt-2">{targetScore}<span className="text-sm text-(--accent-strong) ml-2">+ Hire Zone</span></p>
            </div>
            <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
              <p className="text-xs text-(--muted) flex items-center gap-2"><Star className="w-4 h-4 text-(--accent)" /> Your Best</p>
              <p className="text-3xl font-black text-(--accent) mt-2">{bestScore}</p>
            </div>
            <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
              <p className="text-xs text-(--muted) flex items-center gap-2"><History className="w-4 h-4 text-(--accent-strong)" /> Reviews</p>
              <p className="text-3xl font-black text-(--foreground) mt-2">{reviews.length}</p>
            </div>
            <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
              <p className="text-xs text-(--muted) flex items-center gap-2"><Gauge className="w-4 h-4 text-(--accent-strong)" /> Avg Score</p>
              <p className="text-3xl font-black text-(--foreground) mt-2">{averageScore}<span className="text-sm text-(--muted)"> /100</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-5">
              <h3 className="text-(--foreground) font-bold mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-(--accent)" /> Upload New Resume</h3>
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
                className={`rounded-xl border border-dashed bg-(--surface) p-8 text-center transition-colors ${
                  isDraggingUpload
                    ? 'border-(--accent-strong)/60 bg-(--accent-muted)'
                    : 'border-(--border) hover:border-(--accent-strong)/40'
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
                <p className="text-(--foreground) font-semibold">Drag & drop or click to browse</p>
                <p className="text-xs text-(--muted)">PDF only - Max 10MB</p>
                {isProcessingUpload ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-(--accent)">
                    <Loader2 className="h-4 w-4 animate-spin" /> Reading PDF...
                  </p>
                ) : null}
                {!isProcessingUpload && uploadedFileName ? (
                  <p className="mt-3 text-sm text-(--accent-strong)">Ready: {uploadedFileName}</p>
                ) : null}
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="mt-4 w-full h-24 bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) resize-none"
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
                  className={`mt-4 inline-flex items-center gap-2 disabled:opacity-60 ${buttonVariants('primary', 'md')}`}
                >
                  <Star className="w-4 h-4 fill-current" /> {uploadedFileName ? 'Review Uploaded PDF' : 'Start Review'}
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-(--border) bg-(--surface) p-5">
              <h3 className="text-(--foreground) font-bold mb-3">Industry Benchmark</h3>
              <div className="h-56 rounded-xl bg-(--surface) border border-(--border) flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="mx-auto h-8 w-8 text-(--accent) mb-2" />
                  <p className="text-(--muted)">Resumes scoring 92+ get 3x more callbacks</p>
                  <p className="text-(--accent) text-sm mt-2 font-semibold">See how to improve</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-(--border) bg-(--surface) p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 className="text-xl font-bold text-(--foreground)">Review Existing Resume</h3>
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-(--muted) absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resumes..."
                  className="w-full rounded-lg border border-(--border) bg-(--surface) py-2 pl-10 pr-3 text-sm text-(--foreground) focus:border-(--accent) focus:outline-none"
                />
              </div>
            </div>
            {visibleResumes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-(--border) bg-(--surface) p-6 text-center text-sm text-(--muted)">
                No resumes found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleResumes.map((resume) => {
                  const resumeReviews = reviews
                    .filter((review) => review.resume_id === resume.id)
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  const latestReview = resumeReviews.at(-1)
                  const hasReviews = resumeReviews.length > 0
                  const scoreHistory = resumeReviews.map((r) => Number(r.score || 0)).filter((s) => s > 0)
                  const latestScore = scoreHistory.at(-1) ?? Number(latestReview?.score || 0)
                  return (
                    <div key={resume.id} className="rounded-xl border border-(--border) bg-(--surface) p-4">
                      <p className="text-(--foreground) font-semibold truncate">{resume.title || 'Untitled'}</p>
                      {hasReviews ? (
                        <p className="text-xs text-(--muted) mt-1 flex items-center gap-1 flex-wrap">
                          {`Score ${latestScore}`}
                        </p>
                      ) : (
                        <p className="text-xs text-(--muted) mt-1">Not reviewed yet</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        {hasReviews && latestReview && (
                          <Link
                            href={`/ai-review/${latestReview.id}`}
                            className={`flex-1 ${buttonVariants('primary', 'sm')}`}
                          >
                            View Latest
                          </Link>
                        )}
                        <button
                          onClick={() => void handleAnalyze(resume.id)}
                          disabled={isAnalyzing}
                          className={`${hasReviews ? 'flex-1' : 'w-full'} rounded-lg border border-(--accent)/30 bg-(--accent-muted) px-3 py-2 text-sm text-(--accent) font-semibold disabled:opacity-60`}
                        >
                          {hasReviews ? 'Re-review' : 'Start Review'}
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
```

Implementer notes:
- **Bug fix**: `error` state (e.g. "Upload a resume PDF or select an existing resume first.") was rendered in `text-[#16DB65]` — the same error-colored-as-success bug fixed 4 times already in this codebase (Phase 3's `RedeemCodeCard`, Phase 4's Personal Info summary error and bullet-draft error, and now here). Fixed to `text-red-400`.
- `"+ Hire Zone"` and `"Ready: {filename}"` are genuine positive/success states (not errors), so their `#16DB65` → `text-(--accent-strong)` mapping is correct as-is, not part of the bug fix.
- `UpgradeModal` sits outside the `<Sidebar/>`+content flex wrapper (as a fixed-position overlay), matching the exact placement pattern already used in `ResumeBuilder`/`CoverLetterBuilder`.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/app/ai-review/page.tsx
git commit -m "feat(ai-review): adopt Sidebar layout and restyle landing page with tokens; fix error-color bug"
```

---

### Task 5: Restyle `/ai-review/[id]` + `ResumeAnalyzer.tsx`; migrate auto-fix-warning modal onto `Modal`

**Files:**
- Modify: `src/app/ai-review/[id]/page.tsx` (full replacement)
- Modify: `src/components/analyzer/ResumeAnalyzer.tsx` (full replacement)

**Interfaces:** none new. `ResumeAnalyzer`'s props (`review`, `comparison`, `isLoading`, `error`, `onApplyFix`, `onAutoFix`, `canApplyFixes`, `isSavingAutoFix`, `autoFixError`, `loadingImprovementIndex`, `fixErrors`) unchanged. All handlers in `ai-review/[id]/page.tsx` (`handleApplyFix`, `handleAutoFix`, `loadReview`, `storePatches`, `builderUrl`) byte-for-byte unchanged.

- [ ] **Step 1: Replace `src/app/ai-review/[id]/page.tsx`**

```tsx
"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'
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
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
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
      </div>

      <Modal
        open={showAutoFixTokenWarning}
        onClose={() => setShowAutoFixTokenWarning(false)}
        title="Auto-fix unavailable"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end">
            <button onClick={() => setShowAutoFixTokenWarning(false)} className={buttonVariants('primary', 'md')}>
              Got it
            </button>
          </div>
        }
      >
        <p className="text-sm text-(--muted)">
          {autoFixTokenWarning || 'Auto-fix cannot run due to token limits.'}
        </p>
        {autoFixTokenDetails ? (
          <div className="mt-4 rounded-xl border border-(--border) bg-(--background) px-4 py-3 text-xs text-(--muted) space-y-1">
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
      </Modal>

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
```

Implementer note: the outer wrapper's original `bg-[#020202]` is dropped rather than mapped to `bg-(--background)` — matching the established pattern where `Sidebar`-adopting pages (`/dashboard`, `/resumes`, `/cover-letters`, `/ai-review` landing) don't set an explicit background on their outermost wrapper (the page background comes from `globals.css` already).

- [ ] **Step 2: Replace `ResumeAnalyzer.tsx`**

```tsx
"use client"

import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Zap, Loader2 } from 'lucide-react'
import { AILoadingState } from '@/components/ui/AILoadingState'
import { buttonVariants } from '@/components/ui/Button'

type CategoryItem = {
  score?: number
  max?: number
  label?: string
  feedback?: string
  status?: 'needs_work' | 'ok' | 'good'
}

export type Improvement = {
  issue?: string
  weak_example?: string
  strong_example?: string
}

type AnalysisFeedback = {
  overall_score?: number
  grade?: string
  categories?: {
    ats_structure?: CategoryItem
    content_quality?: CategoryItem
    writing_quality?: CategoryItem
    job_match?: CategoryItem
    application_ready?: CategoryItem
  }
  strengths?: string[]
  improvements?: Improvement[]
}

export type AnalyzerReview = {
  id: string
  resume_id?: string | null
  score?: number | null
  feedback?: AnalysisFeedback
  resumes?: { title?: string } | Array<{ title?: string }> | null
}

function getResumeTitle(value: AnalyzerReview['resumes']) {
  if (!value) return 'Resume'
  if (Array.isArray(value)) return value[0]?.title || 'Resume'
  return value.title || 'Resume'
}

/** Hex color keyed to 0-100 score — used for ring, text, borders. A genuine
 * 4-tier semantic system (excellent/good/fair/poor), not a static dark-theme
 * surface color, so it is intentionally NOT tokenized -- see Global
 * Constraints in the plan for why. */
function scoreColor(score: number): string {
  if (score >= 85) return '#16DB65'  // Excellent / Outstanding
  if (score >= 70) return '#84CC16'  // Good
  if (score >= 50) return '#F97316'  // Fair
  return '#EF4444'                   // Poor / Critical
}

/** Hex color for category progress bars based on fraction achieved. */
function categoryColor(score: number, max: number): string {
  return scoreColor(max > 0 ? Math.round((score / max) * 100) : 0)
}

type ResumeAnalyzerProps = {
  review: AnalyzerReview | null
  comparison?: {
    previousScore: number | null
    previousReviewId: string | null
    delta: number | null
  } | null
  isLoading?: boolean
  error?: string
  onApplyFix?: (improvementIndex: number) => void | Promise<void>
  onAutoFix?: () => void | Promise<void>
  canApplyFixes?: boolean
  isSavingAutoFix?: boolean
  autoFixError?: string
  loadingImprovementIndex?: number | null
  fixErrors?: Record<number, string>
}

export function ResumeAnalyzer({
  review,
  comparison = null,
  isLoading = false,
  error = '',
  onApplyFix,
  onAutoFix,
  canApplyFixes = false,
  isSavingAutoFix = false,
  autoFixError = '',
  loadingImprovementIndex = null,
  fixErrors = {},
}: ResumeAnalyzerProps) {
  if (isLoading) {
    return (
      <div className="bg-(--surface) rounded-2xl border border-(--border) p-10 text-center">
        <AILoadingState stage="generating" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-(--surface) rounded-2xl border border-red-400/30 p-10 text-center text-red-400">
        {error}
      </div>
    )
  }

  if (!review) {
    return (
      <div className="bg-(--surface) rounded-2xl border border-(--border) p-10 text-center text-(--muted)">
        No review data available.
      </div>
    )
  }

  const feedback = review.feedback || {}
  const overallScore = Number(feedback.overall_score ?? review.score ?? 0)
  const grade = feedback.grade || 'Unknown'
  const categories = [
    feedback.categories?.ats_structure,
    feedback.categories?.content_quality,
    feedback.categories?.writing_quality,
    feedback.categories?.job_match,
    feedback.categories?.application_ready,
  ].filter(Boolean) as CategoryItem[]

  const improvements = feedback.improvements || []
  const strengths = feedback.strengths || []
  const ringColor = scoreColor(overallScore)

  const anyFixLoading = loadingImprovementIndex !== null || isSavingAutoFix

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-(--surface) rounded-3xl border border-(--border) p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-(--accent-muted) rounded-bl-[100px] pointer-events-none" />
          <h3 className="text-(--muted) font-medium mb-4 uppercase tracking-wider text-sm">Overall Match Score</h3>

          <div className="relative w-40 h-40 mx-auto flex items-center justify-center rounded-full border-12 border-(--border) mb-6">
            <div
              className="absolute inset-0 border-12 rounded-full border-l-transparent border-b-transparent transform rotate-45"
              style={{ borderColor: ringColor }}
            />
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-(--foreground)">{overallScore}</span>
              <span className="font-bold text-sm" style={{ color: ringColor }}>/ 100</span>
            </div>
          </div>

          <p className="text-(--foreground) font-bold text-xl mb-2">{grade}</p>
          <p className="text-sm text-(--muted)">Review for {getResumeTitle(review.resumes)}.</p>

          {comparison ? (
            <div className="mt-4 rounded-xl border border-(--border) bg-(--background) px-4 py-3 text-left">
              <p className="text-xs uppercase tracking-wide text-(--muted)">vs previous review</p>
              {comparison.delta === null ? (
                <p className="mt-1 text-sm text-(--muted)">First review for this resume.</p>
              ) : (
                <p className={`mt-1 text-sm font-semibold ${comparison.delta >= 0 ? 'text-(--accent-strong)' : 'text-red-400'}`}>
                  {comparison.delta >= 0 ? '+' : ''}{comparison.delta} pts
                  <span className="ml-2 text-xs font-normal text-(--muted)">
                    (prev: {comparison.previousScore ?? 0})
                  </span>
                </p>
              )}
            </div>
          ) : null}

          {/* Auto Fix button */}
          <div className="mt-8">
            {isSavingAutoFix ? (
              <AILoadingState stage="saving" />
            ) : (
              <button
                onClick={() => void onAutoFix?.()}
                disabled={!canApplyFixes || anyFixLoading}
                className={`w-full flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants('primary', 'md')}`}
              >
                <Zap className="w-5 h-5 fill-current" /> Auto-Fix All
              </button>
            )}
            {autoFixError ? (
              <p className="mt-2 text-xs text-red-400">{autoFixError}</p>
            ) : null}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="bg-(--surface) rounded-2xl border border-(--border) p-6">
          <h3 className="text-(--foreground) font-bold mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            {categories.map((item, idx) => {
              const score = Number(item.score || 0)
              const max = Number(item.max || 100)
              const width = Math.max(0, Math.min(100, Math.round((score / max) * 100)))
              return (
                <div key={`${item.label || 'cat'}-${idx}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-(--muted)">{item.label || 'Category'}</span>
                    <span className="text-(--foreground) font-bold">{score}/{max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-(--background) rounded-full">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${width}%`, backgroundColor: categoryColor(score, max) }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-(--surface) rounded-3xl border border-(--border) p-8">
          <h2 className="text-2xl font-bold text-(--foreground) mb-6 border-b border-(--border) pb-4">Actionable Feedback</h2>

          {/* Priority Improvements */}
          <div className="mb-8">
            <h3 className="text-red-400 font-bold flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5" /> Priority Improvements
            </h3>
            <div className="space-y-4">
              {improvements.length === 0 ? (
                <div className="bg-(--surface) rounded-xl border border-(--accent-strong)/20 p-4 text-sm text-(--muted)">
                  No improvement suggestions were returned.
                </div>
              ) : (
                improvements.map((imp, idx) => {
                  const isThisLoading = loadingImprovementIndex === idx
                  const thisError = fixErrors[idx]

                  return (
                    <div
                      key={`${imp.issue || 'issue'}-${idx}`}
                      className={`bg-(--surface) rounded-xl border p-4 space-y-3 transition-colors ${
                        isThisLoading ? 'border-(--accent)/40' : 'border-(--accent-strong)/20'
                      }`}
                    >
                      <p className="text-sm text-(--muted)">{imp.issue || 'Improve clarity and impact.'}</p>
                      <div>
                        <p className="text-sm text-(--muted) mb-2">Current:</p>
                        <p className="text-sm bg-(--accent-muted) text-(--foreground) border-l-2 border-(--accent-strong) px-3 py-2">
                          {imp.weak_example || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-(--muted) mb-2">Suggested:</p>
                        <p className="text-sm bg-(--accent-muted) text-(--accent) border-l-2 border-(--border) px-3 py-2">
                          {imp.strong_example || 'N/A'}
                        </p>
                      </div>

                      <div className="pt-1">
                        {isThisLoading ? (
                          <span className="inline-flex items-center gap-2 text-sm text-(--accent)">
                            <Loader2 className="w-4 h-4 animate-spin" /> Applying fix...
                          </span>
                        ) : (
                          <>
                            {thisError ? (
                              <p className="text-xs text-red-400 mb-2">{thisError}</p>
                            ) : null}
                            {onApplyFix ? (
                              <button
                                onClick={() => void onApplyFix(idx)}
                                disabled={anyFixLoading}
                                className="text-(--accent) text-sm font-medium hover:text-(--accent-strong) flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Apply this fix <ArrowRight className="w-4 h-4" />
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <h3 className="text-(--accent) font-bold flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5" /> Strengths
            </h3>
            <div className="bg-(--surface) rounded-xl border border-(--accent)/20 p-4">
              {strengths.length === 0 ? (
                <p className="text-sm text-(--muted)">No strengths returned.</p>
              ) : (
                <ul className="space-y-3 text-sm text-(--muted)">
                  {strengths.map((s, idx) => (
                    <li key={`${s}-${idx}`} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-(--accent) shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Category Insights */}
          {categories.some((c) => c.feedback) ? (
            <div className="mt-8">
              <h3 className="text-(--accent-strong) font-bold flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> Category Insights
              </h3>
              <div className="space-y-3">
                {categories.map((c, idx) =>
                  c.feedback ? (
                    <div key={`${c.label || 'insight'}-${idx}`} className="bg-(--surface) rounded-xl border border-(--accent-strong)/25 p-4">
                      <p className="text-(--foreground) font-medium mb-1">{c.label || 'Category'}</p>
                      <p className="text-sm text-(--muted)">{c.feedback}</p>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
```

Implementer notes:
- **`scoreColor`/`categoryColor` are untouched** — this is the file's one deliberate exception to "no literal hex," per the Global Constraints note. Do not tokenize these two functions or the `ringColor`/`categoryColor(...)` inline `style=` usages that consume them.
- **Bug fixes**: the top-level `error` prop render, `autoFixError`, and per-improvement `thisError` were all rendered in `text-[#16DB65]` — the same error-colored-as-success bug, all three fixed to `text-red-400` (matching the count noted in Task 4's implementer notes: this is instances 5, 6, and 7 of the same recurring bug across the codebase this redesign has now fixed).
- **Weak/strong example mapping** follows the `BeforeAfterModal` Before/After precedent from Phase 4: weak/"Current" text → `text-(--foreground)` (neutral), strong/"Suggested" text → `text-(--accent)` (positive) — the light-minty `#C8FFD9` had no token equivalent, same reasoning as Phase 4 Task 7.
- **`comparison.delta`** dual-semantic color (score improved vs declined) is a genuine, correct two-way signal, not a bug — mapped `>= 0` (improved) to `text-(--accent-strong)` and the decline branch to `text-red-400` (tokenizing the already-correct `#EF4444`, not "fixing" anything).
- **"Priority Improvements" heading and "Category Insights" heading** icons/text keep their original semantic colors (red for priority/critical, green for insights) — tokenized to `text-red-400` and `text-(--accent-strong)` respectively, not touched as bugs since they were already colored correctly for their meaning.
- Auto-Fix All and the two Save/Export-style buttons elsewhere in this file are the only true primary-gradient CTAs — migrated to `buttonVariants('primary', 'md')`.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 4: Commit**

```bash
git add "src/app/ai-review/[id]/page.tsx" src/components/analyzer/ResumeAnalyzer.tsx
git commit -m "feat(ai-review): restyle detail report + ResumeAnalyzer with tokens; migrate auto-fix modal onto Modal primitive; fix 3 error-color bugs"
```

---

### Task 6: Full functional and visual verification with real seeded data

**Files:** none (verification only)

Reuse the already-authenticated session and seeded local Supabase data from Phases 3-4 (resumes with real content, at least one AI review). Seed a cover letter and an AI review via the UI itself during this task if none exist with real content, since prior seeding scripts only covered resumes/reviews.

- [ ] **Step 1: Visual pass — `/cover-letters` list and editor**

Navigate to `/cover-letters`. Screenshot: confirm `Sidebar` renders with "Cover Letters" highlighted active, list rows show real data, search/sort work. Open a cover letter (or create one via "Create Cover Letter"). Screenshot the editor: confirm no `Sidebar` (full-width, `Navbar`-only, matching `ResumeBuilder`), section-list rows, company/position/job-description/tone fields, and the live preview pane (white page, serif text) all render with tokens.

- [ ] **Step 2: Functional pass — `CoverLetterBuilder`**

Click a section (e.g. "Header Information") — confirm the "Edit Section" modal (now on `Modal`) opens correctly styled, edit and Save, confirm the change reflects in the live preview. Click "Body Paragraphs" — confirm `ParagraphModal` (now on `Modal`) opens, add/remove a paragraph, confirm it updates the preview. Type a change into "Company Name", wait ~2.5s (autosave debounce is 2000ms here, longer than `ResumeBuilder`'s 800ms), reload, confirm it persisted.

- [ ] **Step 3: Visual + functional pass — `/ai-review` landing**

Navigate to `/ai-review`. Screenshot: confirm `Sidebar` renders with "AI Review" active, all 4 stat cards show real numbers (Target Score/Your Best/Reviews/Avg Score), upload dropzone and "Review Existing Resume" grid render with tokens. Trigger the `error` state (e.g. click "Start Review" with nothing uploaded/selected, or use a resume with no AI-extractable content) and confirm the message now renders in red, not green.

- [ ] **Step 4: Visual + functional pass — `/ai-review/[id]` + `ResumeAnalyzer`**

Open an existing AI review. Screenshot: confirm `Sidebar` renders, the score ring/breakdown/improvements/strengths panels all render with tokens, and — critically — confirm `scoreColor`'s 4-tier system still visibly works (the ring and category bars should still shift between red/orange/lime/green based on score, not collapse to a single color). If any "Apply this fix" or "Auto-Fix All" action is available, exercise it; if it fails, confirm it's the same pre-existing environment reason documented in Phase 4 (missing `ANTHROPIC_API_KEY`), not a new regression, and confirm any resulting error text renders in red.

- [ ] **Step 5: Responsive collapse**

Resize to ≤1024px for `/cover-letters`, `/ai-review`, and `/ai-review/[id]` (Sidebar-adopting pages) — confirm `Sidebar` disappears and `Navbar` takes over cleanly, matching the already-proven Phase 3/4 pattern. Resize the `CoverLetterBuilder` editor to a narrow width — confirm the two-pane split stacks without clipping content, matching `ResumeBuilder`'s already-verified behavior.

- [ ] **Step 6: Run the full static verification suite**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

Run: `npm run lint`
Expected: 0 errors (same 4 pre-existing unrelated warnings in `src/app/api/*` are fine)

Run: `npm test`
Expected: all existing tests pass

- [ ] **Step 7: Report to user**

Show screenshots from Steps 1-4, confirm results of Steps 2, 5 explicitly (pass/fail per item), and the Step 6 command outputs. Any failure is a blocking finding — root-cause it, fix it, re-verify, and document it, following the same rigor as every fix in Phases 3-4.

