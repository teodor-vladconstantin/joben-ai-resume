# ResuMax-Style Redesign — Phase 4: Resume Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `/resumes` (list) and the resume builder editor (`/resumes/new`, `/resumes/[id]`) onto the Phase 0-3 token system, matching resumax.ai's visual language for equivalent surfaces, with zero change to data-fetching/autosave/AI actions/PDF import/export logic and zero change to Joben's existing tab-based information architecture.

**Architecture:** `/resumes` adopts the `Sidebar` layout (Phase 3 pattern). The builder keeps its existing `Navbar`-only shell, tab switcher, and bottom Save/Export bar — restyled in place. A new `Modal` primitive (header/body/footer) is introduced and adopted by all modal-shaped UI in the builder (4 standalone components + 4 inline modal blocks inside `ResumeBuilder.tsx`).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind v4 (CSS-var arbitrary-value syntax), lucide-react icons, framer-motion.

## Global Constraints

- Restyle only: every task changes `className`/style values and, where explicitly called out as a bundled bug fix, a color-only Tailwind class — never a prop, handler, state variable, data-fetch call, or JSX structural nesting.
- Color-only edits on `ResumeBuilder.tsx`: only `bg-*`, `text-*`, `border-*`, `from-*`/`to-*` (gradients), `divide-*` classes change. `rounded-*`, spacing (`p-*`, `gap-*`, `m-*`), and flex/grid layout classes are left untouched (matches the established Phase 3 precedent — radius/spacing were not unified onto `--radius` tokens there either).
- Token mapping (established Phase 0-3, `src/app/globals.css`):
  - `#0A0F0D`, `bg-[#111]` (dark surface) → `bg-(--surface)`
  - `#020202` (nested-input darkest bg) → `bg-(--background)`
  - `text-white`, `text-white/95`, `text-[#FFFFFF]/88` → `text-(--foreground)`
  - `text-[#FFFFFF]/82`, `/78`, `/72`, `/60`, `text-white/50`, `/40`, `/20` → `text-(--muted)`
  - `border-white/10`, `/12`, `/20`, `/30` → `border-(--border)`
  - `#0A9548` solid → `text-(--accent)` / `border-(--accent)`; `bg-[#0A9548]/10`-`/20` translucent → `bg-(--accent-muted)` (or `bg-(--accent)/NN` when a non-12%-alpha strength is needed, matching the source's alpha)
  - `#16DB65` → `text-(--accent-strong)` / `border-(--accent-strong)` (except where it's colored on *error* text — see per-task bug-fix notes)
  - `bg-linear-to-r from-[#0A9548] to-[#04471C]` primary CTA gradients → `buttonVariants('primary', size)` from `@/components/ui/Button`
  - `#052A14` (dark text on bright accent bg) → `text-(--background)`
  - Existing `red-400`/`red-300`/`red-800`/`red-900` error styling and `amber-300/90` credit-warning text are already-correct semantic colors (no semantic warning/error token exists yet, per Phase 0's documented deferral) — left as literal Tailwind utilities, untouched.
- After every task: `npx tsc --noEmit` must pass with no new errors.
- After every task: live Playwright verification against the already-seeded local session (2 resumes, 1 cover letter, 2 ai_reviews) + **explicit user confirmation before starting the next task** — this phase runs at finer granularity than Phases 0-3 by user mandate.

---

### Task 1: Create the `Modal` primitive

**Files:**
- Create: `src/components/ui/Modal.tsx`

**Interfaces:**
- Produces: `export function Modal({ open, onClose, title, children, footer, maxWidth }: ModalProps)` — `maxWidth?: 'md' | 'lg' | 'xl' | '2xl'` (default `'lg'`). Consumed by Task 7.

- [ ] **Step 1: Write the component**

```tsx
"use client"

import * as React from 'react'
import { X } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl'
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ModalProps['maxWidth']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, footer, maxWidth = 'lg' }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <Card
        elevated
        radius="lg"
        className={`relative flex w-full ${MAX_WIDTH_CLASSES[maxWidth]} max-h-[85vh] flex-col shadow-2xl`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-(--border) px-6 py-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-(--foreground)">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-(--muted) hover:bg-(--surface-elevated) hover:text-(--foreground)"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 grow overflow-y-auto px-6 py-5">{children}</div>

        {footer ? <div className="shrink-0 border-t border-(--border) px-6 py-4">{footer}</div> : null}
      </Card>
    </div>
  )
}
```

Implementer notes:
- `Card` (Phase 0 primitive, `src/components/ui/Card.tsx`) already provides `elevated`/`radius="lg"` → `bg-(--surface-elevated)` + `rounded-(--radius-lg)` + `border-(--border)`, so the modal shell inherits the same surface treatment used everywhere else.
- `header` uses uppercase mono title matching resumax's reference modal pattern (observed in the design research: "uppercase mono title + X close").
- `footer` is an optional slot — consumers pass their own button row (Cancel/Save, etc.) so this primitive stays presentation-only, no baked-in button assumptions.
- No focus trap / escape-key handling is added — none of the 4 existing modals being migrated have that today either (confirmed by reading `AddContentModal.tsx`, `UpgradeModal.tsx`, `BeforeAfterModal.tsx`, `ResumeOnboardingModal.tsx`), so this stays a pure visual-parity swap, not a new a11y feature.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Modal.tsx
git commit -m "feat(builder): add Modal primitive (header/body/footer)"
```

---

### Task 2: Restyle `/resumes` (resume list page)

**Files:**
- Modify: `src/app/resumes/page.tsx` (full replacement)

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

type ResumeListItem = {
  id: string
  title: string | null
  score: number | null
  updated_at: string
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
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-7">
            <div>
              <h1 className="text-3xl font-bold text-(--foreground) mb-2">Resumes</h1>
              <p className="text-(--muted)">{resumes.length} resumes</p>
            </div>
            <Link href="/resumes/new" className={`w-full justify-center sm:w-auto ${buttonVariants('primary', 'md')}`}>
              <Plus className="w-5 h-5" /> Create Resume
            </Link>
          </div>

          <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-3xl">
              <Search className="w-4 h-4 text-(--muted) absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resumes..."
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
            {visibleResumes.length === 0 ? (
              <div className="p-10 text-center text-(--muted)">
                <p>No resumes found.</p>
              </div>
            ) : (
              <div className="divide-y divide-(--border)">
                {visibleResumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-(--surface-elevated) transition-colors">
                    <div className="min-w-0">
                      <p className="text-(--foreground) font-semibold truncate">{resume.title || 'Untitled'}</p>
                      <p className="text-xs text-(--muted)">Updated {new Date(resume.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold px-2 py-1 rounded bg-(--accent-muted) text-(--accent)">
                        {Number(resume.score || 0)}
                      </span>
                      <span className="text-xs text-(--muted) hidden md:flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {timeAgo(resume.updated_at)}</span>
                      <Link href={`/resumes/${resume.id}`} className="text-(--muted) hover:text-(--foreground)"><Eye className="w-4 h-4" /></Link>
                      <Link href={`/resumes/${resume.id}`} className="text-(--muted) hover:text-(--foreground)"><Edit className="w-4 h-4" /></Link>
                      <button
                        onClick={() => handleDelete(resume.id)}
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

Implementer notes (bundled bug fixes, same class as Phase 3's `RedeemCodeCard`/dead-ternary fixes — flag in the PR, don't skip):
- Original `divide-y divide-[#0A9548]` used the **solid** mid-green accent as a row divider, which would render as a bold, jarring green line between every row — clearly unintentional given every other border in this file uses a subtle `white/10`. Mapped to `divide-(--border)` instead.
- Original delete button was `text-[#16DB65] hover:text-[#16DB65]` — identical default/hover color, a no-op hover (same class of bug as the dead ternary Phase 3 already fixed in `dashboard/page.tsx`). Collapsed to the single static class `text-(--accent-strong)`, matching the accent-colored (not red) delete-icon convention already used pervasively for entry deletes inside `ResumeBuilder.tsx` — this page shouldn't invent a different (red) delete convention unilaterally.
- Original list-row hover was `hover:bg-[#0A0F0D]`, identical to the row's inherited background — another no-op hover. Mapped to `hover:bg-(--surface-elevated)` so the hover state is now actually visible, consistent with every other hoverable row/card elsewhere in the app (`StatCards`, `RecentDocuments`, etc.).
- All fetch/delete/sort/search logic (`loadResumes`, `handleDelete`, `visibleResumes` memo, `timeAgo`) is byte-for-byte unchanged.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/app/resumes/page.tsx
git commit -m "feat(resumes): adopt Sidebar layout and restyle list with tokens"
```

---

### Task 3: Restyle the builder's outer shell (tabs bar, action row, banners)

**Files:**
- Modify: `src/components/builder/ResumeBuilder.tsx:1385-1490` (region only — do not touch anything outside this exact block)

**Interfaces:** none new — no props/state/handlers change. `tabs`, `activeTab`, `setActiveTab`, `resumeData.template`, `setResumeData`, `isAddModalOpen`/`setIsAddModalOpen`, `getPdfImportCount`, `MAX_PDF_IMPORTS_PER_RESUME`, `isImportingPdf`, `importInputRef`, `setIsTailorModalOpen`, `fixBanner`/`setFixBanner`, `uploadError`, `startUploadFlow`, `showImportLimitModal`/`setShowImportLimitModal` are all consumed exactly as before.

- [ ] **Step 1: Read the current file first**

Read `src/components/builder/ResumeBuilder.tsx` to get the byte-exact current content of lines 1385-1490 before editing — line numbers may have shifted slightly if this repo has drifted since this plan was written. Locate the region by the unique anchor comment `{/* Editor Sidebar */}` immediately following the `return (` statement, through to (but not including) the `{activeTab === 'personal' && (` line.

- [ ] **Step 2: Apply the color-only edit**

Find this exact block:

```tsx
  return (
    <div className="w-full h-full min-h-0 flex flex-col lg:min-w-315 lg:flex-row print:block" suppressHydrationWarning>
      {/* Editor Sidebar */}
      <div
        className="w-full min-h-0 bg-[#0A0F0D] border-r border-white/10 flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden z-10 shadow-2xl lg:w-115 lg:min-w-115 lg:max-w-115 lg:shrink-0 print:hidden"
        suppressHydrationWarning
      >
        <input
          ref={importInputRef}
          id="pdf-import-input"
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              startUploadFlow(file)
              e.currentTarget.value = ''
            }
          }}
        />
        <div
          className="shrink-0 border-b border-white/10 px-4 pt-5 pb-4 flex items-center gap-2.5 overflow-x-auto overflow-y-hidden custom-scrollbar tabs-scrollbar scroll-smooth"
          suppressHydrationWarning
          style={{ scrollbarGutter: 'stable both-edges' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-35 items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.id 
                ? 'bg-[#0A9548]/10 text-[#0A9548] border border-[#0A9548]/30' 
                : 'text-[#FFFFFF]/82 hover:bg-[#0A0F0D] hover:text-white border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="shrink-0 p-4 pt-5 border-b border-white/10 space-y-3">
          <TemplateSwitcher
            value={resumeData.template}
            onChange={(value) =>
              setResumeData((prev) => ({
                ...prev,
                template: value,
              }))
            }
          />
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 rounded-lg border border-[#0A9548]/30 bg-[#0A9548]/10 px-3 py-2 text-sm font-semibold text-[#0A9548] hover:bg-[#0A9548]/20"
            >
              + Add Section
            </button>
            <button
              onClick={() => {
                if (getPdfImportCount(resumeData) >= MAX_PDF_IMPORTS_PER_RESUME) {
                  setShowImportLimitModal(true)
                  return
                }
                importInputRef.current?.click()
              }}
              disabled={isImportingPdf}
              className="flex-1 rounded-lg border border-white/10 bg-[#0A0F0D] px-3 py-2 text-sm font-semibold text-white/88 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImportingPdf
                ? 'Importing...'
                : `Import PDF/DOCX (${getPdfImportCount(resumeData)}/${MAX_PDF_IMPORTS_PER_RESUME})`}
            </button>
            <FeatureButton
              feature="jds"
              onClick={() => setIsTailorModalOpen(true)}
              className="flex-1 rounded-lg border border-white/12 bg-[#0A0F0D] px-3 py-2 text-sm font-semibold text-[#0A9548] hover:bg-[#0A0F0D]"
            >
              AI Tailor
            </FeatureButton>
          </div>
        </div>
        
        {fixBanner ? (
          <div className="shrink-0 mx-4 mt-3 rounded-xl border border-[#0A9548]/40 bg-[#0A9548]/10 px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-sm text-[#16DB65] font-medium">{fixBanner}</p>
            <button
              onClick={() => setFixBanner(null)}
              className="text-[#FFFFFF]/60 hover:text-white text-xs shrink-0"
            >
              x
            </button>
          </div>
        ) : null}

        {uploadError ? (
          <div className="shrink-0 mx-4 mt-3 flex gap-3 rounded-xl border border-red-800/60 bg-red-900/20 px-4 py-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{uploadError}</p>
          </div>
        ) : null}

        <div
          className="min-h-0 grow p-6 overflow-y-auto custom-scrollbar builder-panel-scrollbar"
          suppressHydrationWarning
          style={{ scrollbarGutter: 'stable both-edges' }}
        >
```

Replace with:

```tsx
  return (
    <div className="w-full h-full min-h-0 flex flex-col lg:min-w-315 lg:flex-row print:block" suppressHydrationWarning>
      {/* Editor Sidebar */}
      <div
        className="w-full min-h-0 bg-(--surface) border-r border-(--border) flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden z-10 shadow-2xl lg:w-115 lg:min-w-115 lg:max-w-115 lg:shrink-0 print:hidden"
        suppressHydrationWarning
      >
        <input
          ref={importInputRef}
          id="pdf-import-input"
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              startUploadFlow(file)
              e.currentTarget.value = ''
            }
          }}
        />
        <div
          className="shrink-0 border-b border-(--border) px-4 pt-5 pb-4 flex items-center gap-2.5 overflow-x-auto overflow-y-hidden custom-scrollbar tabs-scrollbar scroll-smooth"
          suppressHydrationWarning
          style={{ scrollbarGutter: 'stable both-edges' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-35 items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.id 
                ? 'bg-(--accent-muted) text-(--accent) border border-(--accent)/30' 
                : 'text-(--muted) hover:bg-(--surface-elevated) hover:text-(--foreground) border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="shrink-0 p-4 pt-5 border-b border-(--border) space-y-3">
          <TemplateSwitcher
            value={resumeData.template}
            onChange={(value) =>
              setResumeData((prev) => ({
                ...prev,
                template: value,
              }))
            }
          />
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 rounded-lg border border-(--accent)/30 bg-(--accent-muted) px-3 py-2 text-sm font-semibold text-(--accent) hover:bg-(--accent)/20"
            >
              + Add Section
            </button>
            <button
              onClick={() => {
                if (getPdfImportCount(resumeData) >= MAX_PDF_IMPORTS_PER_RESUME) {
                  setShowImportLimitModal(true)
                  return
                }
                importInputRef.current?.click()
              }}
              disabled={isImportingPdf}
              className="flex-1 rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--foreground) hover:bg-(--surface-elevated) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImportingPdf
                ? 'Importing...'
                : `Import PDF/DOCX (${getPdfImportCount(resumeData)}/${MAX_PDF_IMPORTS_PER_RESUME})`}
            </button>
            <FeatureButton
              feature="jds"
              onClick={() => setIsTailorModalOpen(true)}
              className="flex-1 rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--accent) hover:bg-(--surface-elevated)"
            >
              AI Tailor
            </FeatureButton>
          </div>
        </div>
        
        {fixBanner ? (
          <div className="shrink-0 mx-4 mt-3 rounded-xl border border-(--accent)/40 bg-(--accent-muted) px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-sm text-(--accent-strong) font-medium">{fixBanner}</p>
            <button
              onClick={() => setFixBanner(null)}
              className="text-(--muted) hover:text-(--foreground) text-xs shrink-0"
            >
              x
            </button>
          </div>
        ) : null}

        {uploadError ? (
          <div className="shrink-0 mx-4 mt-3 flex gap-3 rounded-xl border border-red-800/60 bg-red-900/20 px-4 py-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{uploadError}</p>
          </div>
        ) : null}

        <div
          className="min-h-0 grow p-6 overflow-y-auto custom-scrollbar builder-panel-scrollbar"
          suppressHydrationWarning
          style={{ scrollbarGutter: 'stable both-edges' }}
        >
```

Implementer notes:
- `uploadError` banner block is intentionally left untouched — it already uses correct semantic red (`red-800`/`red-900`/`red-400`/`red-300`), not dark-palette hex, so there's nothing to token-map.
- `fixBanner` is a **success** message ("AI applied N improvements..."), so mapping `#16DB65` → `text-(--accent-strong)` is correct here — do not confuse this with the genuine error-color bug fixed in Task 4's bullet-draft error text.
- AI Tailor button's original `hover:bg-[#0A0F0D]` was identical to its own resting `bg-[#0A0F0D]` — a no-op hover. Mapped to `hover:bg-(--surface-elevated)` so it's now visible, matching the Import PDF/DOCX button's hover treatment right next to it.
- `lg:w-115`, `lg:min-w-115`, `min-w-35`, all `rounded-lg`/`rounded-xl`, and all spacing classes are untouched per the Global Constraints (color-only edits).

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 4: Commit**

```bash
git add src/components/builder/ResumeBuilder.tsx
git commit -m "feat(builder): restyle outer shell (tabs, action row, banners) with tokens"
```

---

### Task 4: Restyle Personal Info + Experience tab content

**Files:**
- Modify: `src/components/builder/ResumeBuilder.tsx` (two regions — Personal tab, then Experience tab)

**Interfaces:** none new. All handlers (`updatePersonalField`, `setIsSummaryGeneratorOpen`, `setSummaryGenerationMode`, `setSummaryRoleDescription`, `handleGenerateSummary`, `handleAddRole`, `handleDeleteExperience`, `updateExperienceMetaField`, `updateExperienceDateField`, `addExperienceBullet`, `updateExperienceBulletField`, `removeExperienceBullet`, `handleGenerateBulletDraft`, `handleAcceptBulletDraft`) and all state reads (`resumeData.personal.*`, `resumeData.experience`, `bulletDraftStates`, `highlightedBulletIndex`, `isSummaryGeneratorOpen`, `summaryGenerationMode`, `summaryRoleDescription`, `isGeneratingSummary`, `generatedSummaryDraft`, `summaryGenerationError`) are consumed exactly as before.

- [ ] **Step 1: Read the current file first**

Read `src/components/builder/ResumeBuilder.tsx` to confirm current line numbers for the `{activeTab === 'personal' && (` block through the end of `{activeTab === 'experience' && (` block (originally lines 1491-1819) before editing.

- [ ] **Step 2: Apply the color-only edit — Personal tab**

Find this exact block (originally lines 1491-1648):

```tsx
          {activeTab === 'personal' && (
            <div className="space-y-4" suppressHydrationWarning>
              <h2 className="text-xl font-bold text-white mb-6">Personal details</h2>
              {/* Form fields would be controlled components, omitted for brevity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">First Name</label>
                  <input type="text" value={resumeData.personal.firstName} onChange={(e) => updatePersonalField('firstName', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">Last Name</label>
                  <input type="text" value={resumeData.personal.lastName} onChange={(e) => updatePersonalField('lastName', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#FFFFFF]/82">Job Title</label>
                <input type="text" value={resumeData.personal.title} onChange={(e) => updatePersonalField('title', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">Email</label>
                  <input type="email" value={resumeData.personal.email} onChange={(e) => updatePersonalField('email', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">Phone</label>
                  <input type="text" value={resumeData.personal.phone} onChange={(e) => updatePersonalField('phone', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#FFFFFF]/82">Location</label>
                <input type="text" value={resumeData.personal.location || ''} onChange={(e) => updatePersonalField('location', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="Cluj-Napoca, Romania" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">Professional Summary</label>
                  <button
                    onClick={() => setIsSummaryGeneratorOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#0A9548]/40 bg-[#0A9548]/10 px-2.5 py-1 text-xs font-semibold text-[#16DB65] hover:bg-[#0A9548]/20"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate with AI
                  </button>
                </div>

                <RichTextarea
                  value={resumeData.personal.summary}
                  onValueChange={(value) => updatePersonalField('summary', value)}
                  className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors h-28 resize-none"
                  placeholder="Professional summary"
                  toolbarLabel="Summary formatting"
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">LinkedIn URL</label>
                  <input type="text" value={resumeData.personal.linkedin || ''} onChange={(e) => updatePersonalField('linkedin', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="https://linkedin.com/in/yourname" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">GitHub URL</label>
                  <input type="text" value={resumeData.personal.github || ''} onChange={(e) => updatePersonalField('github', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="https://github.com/yourusername" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">Website / Portfolio</label>
                  <input type="text" value={resumeData.personal.website || ''} onChange={(e) => updatePersonalField('website', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="https://yourdomain.com" />
                </div>

                {isSummaryGeneratorOpen ? (
                  <div className="rounded-xl border border-white/10 bg-[#020202] p-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSummaryGenerationMode('resume')}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          summaryGenerationMode === 'resume'
                            ? 'border border-[#0A9548]/40 bg-[#0A9548]/15 text-[#16DB65]'
                            : 'border border-white/10 bg-[#0A0F0D] text-[#FFFFFF]/78 hover:text-white'
                        }`}
                      >
                        Based on my resume
                      </button>
                      <button
                        onClick={() => setSummaryGenerationMode('scratch')}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          summaryGenerationMode === 'scratch'
                            ? 'border border-[#0A9548]/40 bg-[#0A9548]/15 text-[#16DB65]'
                            : 'border border-white/10 bg-[#0A0F0D] text-[#FFFFFF]/78 hover:text-white'
                        }`}
                      >
                        Write from scratch
                      </button>
                    </div>

                    {summaryGenerationMode === 'scratch' ? (
                      <textarea
                        value={summaryRoleDescription}
                        onChange={(e) => setSummaryRoleDescription(e.target.value)}
                        className="h-24 w-full resize-none rounded-lg border border-white/10 bg-[#0A0F0D] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                        placeholder="Describe your target role, level, and focus areas..."
                      />
                    ) : null}

                    {isGeneratingSummary ? (
                      <div className="rounded-lg border border-white/10 bg-[#0A0F0D]">
                        <AILoadingState stage="generating" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setIsSummaryGeneratorOpen(false)}
                          className="rounded-md border border-white/10 bg-[#0A0F0D] px-3 py-1.5 text-xs font-medium text-[#FFFFFF]/78 hover:text-white"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => void handleGenerateSummary(summaryGenerationMode)}
                          className="rounded-md bg-linear-to-r from-[#0A9548] to-[#04471C] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                        >
                          Generate summary
                        </button>
                      </div>
                    )}

                    {summaryGenerationError ? (
                      <p className="text-xs text-[#16DB65]">{summaryGenerationError}</p>
                    ) : null}

                    <AnimatePresence>
                      {generatedSummaryDraft ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="rounded-lg border border-[#0A9548]/30 bg-[#0A9548]/8 p-3 space-y-2"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#16DB65]">AI Draft</p>
                          <p className="text-sm text-white/95 leading-relaxed">{generatedSummaryDraft}</p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => void handleGenerateSummary(summaryGenerationMode)}
                              disabled={isGeneratingSummary}
                              className="rounded-md border border-white/10 bg-[#0A0F0D] px-3 py-1.5 text-xs font-medium text-[#FFFFFF]/78 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Regenerate
                            </button>
                            <button
                              onClick={() => updatePersonalField('summary', generatedSummaryDraft)}
                              className="rounded-md bg-[#16DB65] px-3 py-1.5 text-xs font-semibold text-[#052A14] hover:bg-[#2AEA7A]"
                            >
                              Accept summary
                            </button>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}
              </div>
            </div>
          )}
```

Replace with:

```tsx
          {activeTab === 'personal' && (
            <div className="space-y-4" suppressHydrationWarning>
              <h2 className="text-xl font-bold text-(--foreground) mb-6">Personal details</h2>
              {/* Form fields would be controlled components, omitted for brevity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">First Name</label>
                  <input type="text" value={resumeData.personal.firstName} onChange={(e) => updatePersonalField('firstName', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">Last Name</label>
                  <input type="text" value={resumeData.personal.lastName} onChange={(e) => updatePersonalField('lastName', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-(--muted)">Job Title</label>
                <input type="text" value={resumeData.personal.title} onChange={(e) => updatePersonalField('title', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">Email</label>
                  <input type="email" value={resumeData.personal.email} onChange={(e) => updatePersonalField('email', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">Phone</label>
                  <input type="text" value={resumeData.personal.phone} onChange={(e) => updatePersonalField('phone', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-(--muted)">Location</label>
                <input type="text" value={resumeData.personal.location || ''} onChange={(e) => updatePersonalField('location', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="Cluj-Napoca, Romania" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-(--muted)">Professional Summary</label>
                  <button
                    onClick={() => setIsSummaryGeneratorOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-(--accent)/40 bg-(--accent-muted) px-2.5 py-1 text-xs font-semibold text-(--accent-strong) hover:bg-(--accent)/20"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate with AI
                  </button>
                </div>

                <RichTextarea
                  value={resumeData.personal.summary}
                  onValueChange={(value) => updatePersonalField('summary', value)}
                  className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors h-28 resize-none"
                  placeholder="Professional summary"
                  toolbarLabel="Summary formatting"
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">LinkedIn URL</label>
                  <input type="text" value={resumeData.personal.linkedin || ''} onChange={(e) => updatePersonalField('linkedin', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="https://linkedin.com/in/yourname" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">GitHub URL</label>
                  <input type="text" value={resumeData.personal.github || ''} onChange={(e) => updatePersonalField('github', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="https://github.com/yourusername" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">Website / Portfolio</label>
                  <input type="text" value={resumeData.personal.website || ''} onChange={(e) => updatePersonalField('website', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="https://yourdomain.com" />
                </div>

                {isSummaryGeneratorOpen ? (
                  <div className="rounded-xl border border-(--border) bg-(--background) p-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSummaryGenerationMode('resume')}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          summaryGenerationMode === 'resume'
                            ? 'border border-(--accent)/40 bg-(--accent)/15 text-(--accent-strong)'
                            : 'border border-(--border) bg-(--surface) text-(--muted) hover:text-(--foreground)'
                        }`}
                      >
                        Based on my resume
                      </button>
                      <button
                        onClick={() => setSummaryGenerationMode('scratch')}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          summaryGenerationMode === 'scratch'
                            ? 'border border-(--accent)/40 bg-(--accent)/15 text-(--accent-strong)'
                            : 'border border-(--border) bg-(--surface) text-(--muted) hover:text-(--foreground)'
                        }`}
                      >
                        Write from scratch
                      </button>
                    </div>

                    {summaryGenerationMode === 'scratch' ? (
                      <textarea
                        value={summaryRoleDescription}
                        onChange={(e) => setSummaryRoleDescription(e.target.value)}
                        className="h-24 w-full resize-none rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Describe your target role, level, and focus areas..."
                      />
                    ) : null}

                    {isGeneratingSummary ? (
                      <div className="rounded-lg border border-(--border) bg-(--surface)">
                        <AILoadingState stage="generating" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setIsSummaryGeneratorOpen(false)}
                          className="rounded-md border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--muted) hover:text-(--foreground)"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => void handleGenerateSummary(summaryGenerationMode)}
                          className={`rounded-md text-xs ${buttonVariants('primary', 'sm')}`}
                        >
                          Generate summary
                        </button>
                      </div>
                    )}

                    {summaryGenerationError ? (
                      <p className="text-xs text-red-400">{summaryGenerationError}</p>
                    ) : null}

                    <AnimatePresence>
                      {generatedSummaryDraft ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="rounded-lg border border-(--accent)/30 bg-(--accent)/8 p-3 space-y-2"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-(--accent-strong)">AI Draft</p>
                          <p className="text-sm text-(--foreground)/95 leading-relaxed">{generatedSummaryDraft}</p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => void handleGenerateSummary(summaryGenerationMode)}
                              disabled={isGeneratingSummary}
                              className="rounded-md border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--muted) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Regenerate
                            </button>
                            <button
                              onClick={() => updatePersonalField('summary', generatedSummaryDraft)}
                              className="rounded-md bg-(--accent-strong) px-3 py-1.5 text-xs font-semibold text-(--background) hover:bg-(--accent)"
                            >
                              Accept summary
                            </button>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}
              </div>
            </div>
          )}
```

Implementer notes:
- **Bug fix**: `summaryGenerationError` (a genuine error — "Please describe the target role before generating from scratch.") was rendered in `text-[#16DB65]` (bright accent green), the same error-colored-as-success bug already fixed in Phase 3's `RedeemCodeCard`. Fixed to `text-red-400`.
- Add `import { buttonVariants } from '@/components/ui/Button'` to this file's import block (not currently imported) — needed for the "Generate summary" button, which replaces its old `bg-linear-to-r from-[#0A9548] to-[#04471C]` gradient with the established `buttonVariants('primary', 'sm')` treatment (same pattern used for every other primary gradient CTA removed in Phases 0-3).
- `text-white/95` → `text-(--foreground)/95` (kept the `/95` opacity suffix — Tailwind v4 allows opacity modifiers on `text-(--var)` arbitrary-value syntax, preserving the original's near-full-but-not-100% opacity intent).

- [ ] **Step 3: Apply the color-only edit — Experience tab**

Find this exact block (originally lines 1650-1819):

```tsx
          {activeTab === 'experience' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Work Experience</h2>
                <button onClick={handleAddRole} className="text-[#0A9548] text-sm font-medium hover:text-[#16DB65]">+ Add Role</button>
              </div>
              
              {resumeData.experience.map((exp, expIndex) => {
                const experienceBullets = getExperienceBullets(exp)
                const globalBulletOffset = resumeData.experience
                  .slice(0, expIndex)
                  .reduce((sum, e) => sum + getExperienceBullets(e).length, 0)

                return (
                 <div key={exp.id} className="bg-[#0A0F0D] border border-white/10 rounded-xl p-4 hover:border-[#16DB65]/60 transition-colors" suppressHydrationWarning>
                   <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                     <p className="text-xs uppercase tracking-wide text-[#FFFFFF]/82">Experience Entry</p>
                     <div className="flex gap-2" suppressHydrationWarning>
                       <button 
                         onClick={() => handleDeleteExperience(exp.id)}
                         disabled={isPending}
                         className="text-[#16DB65] hover:text-[#2AEA7A] p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isPending ? <div className="w-4 h-4 border-2 border-[#16DB65] border-t-transparent rounded-full animate-spin"></div> : <Trash2 className="w-4 h-4" />}
                       </button>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <input
                       value={exp.title}
                       onChange={(e) => updateExperienceMetaField(exp.id, 'title', e.target.value)}
                       className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                       placeholder="Role title"
                     />
                     <input
                       value={exp.company}
                       onChange={(e) => updateExperienceMetaField(exp.id, 'company', e.target.value)}
                       className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                       placeholder="Company"
                     />
                     <MonthYearRangeField
                       monthLabels={MONTH_LABELS}
                       startMonth={exp.startMonth}
                       startYear={exp.startYear}
                       endMonth={exp.endMonth}
                       endYear={exp.endYear}
                       isCurrent={exp.isCurrent ?? false}
                       onStartMonthChange={(value) => updateExperienceDateField(exp.id, 'startMonth', value)}
                       onStartYearChange={(value) => updateExperienceDateField(exp.id, 'startYear', value)}
                       onEndMonthChange={(value) => updateExperienceDateField(exp.id, 'endMonth', value)}
                       onEndYearChange={(value) => updateExperienceDateField(exp.id, 'endYear', value)}
                       onIsCurrentChange={(value) => updateExperienceDateField(exp.id, 'isCurrent', value)}
                     />

                     <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <p className="text-xs uppercase tracking-wide text-[#FFFFFF]/72">Impact Bullets</p>
                         <button
                           onClick={() => addExperienceBullet(exp.id)}
                           className="text-xs font-medium text-[#0A9548] hover:text-[#16DB65]"
                         >
                           + Add Bullet
                         </button>
                       </div>

                       {experienceBullets.map((bullet, bulletIndex) => {
                         const globalIdx = globalBulletOffset + bulletIndex
                         const isHighlighted = highlightedBulletIndex === globalIdx
                         const draftKey = getBulletFieldKey(exp.id, bulletIndex)
                         const draftState = bulletDraftStates[draftKey]
                         const hasDraft = Boolean(draftState?.draft?.trim())
                         return (
                         <div key={`${exp.id}-bullet-${bulletIndex}`} className="space-y-2">
                           <motion.div
                             initial={{ opacity: 0, y: 8 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ duration: 0.2, ease: 'easeOut' }}
                             className="flex items-start gap-2"
                           >
                             <span className="pt-9 text-[#0A9548]">•</span>
                             <RichTextarea
                               ref={(node) => {
                                 bulletFieldRefs.current[draftKey] = node
                               }}
                               data-bullet-global-index={globalIdx}
                               value={bullet}
                               onValueChange={(value) => updateExperienceBulletField(exp.id, bulletIndex, value)}
                               className={`h-20 w-full resize-none rounded-lg border bg-[#020202] px-3 py-2 text-sm text-white focus:outline-none transition-colors ${
                                 isHighlighted
                                   ? 'border-[#16DB65] ring-2 ring-[#16DB65]/40 focus:border-[#16DB65]'
                                   : 'border-white/10 focus:border-[#16DB65]'
                               }`}
                               placeholder="Describe measurable impact"
                               toolbarLabel="Bullet formatting"
                             />
                             <div className="flex flex-col gap-1 pt-7">
                               <button
                                 onClick={() => void handleGenerateBulletDraft(exp.id, bulletIndex)}
                                 disabled={Boolean(draftState?.isLoading)}
                                 className="rounded-md border border-[#0A9548]/40 px-2 py-1 text-[11px] text-[#0A9548] hover:bg-[#0A9548]/10 disabled:cursor-not-allowed disabled:opacity-70"
                               >
                                 {draftState?.isLoading ? 'AI...' : 'AI Draft'}
                               </button>
                               <button
                                 onClick={() => removeExperienceBullet(exp.id, bulletIndex)}
                                 disabled={experienceBullets.length === 1}
                                 className="rounded-md border border-[#16DB65]/35 px-2 py-1 text-[11px] text-[#16DB65] hover:bg-[#0A9548]/12 disabled:cursor-not-allowed disabled:opacity-40"
                               >
                                 Del
                               </button>
                             </div>
                           </motion.div>

                           <p className="pl-5 text-[11px] text-amber-300/90">
                             AI Draft and Regenerate each consume 1 bullet rewrite credit.
                           </p>

                           {draftState?.isLoading ? (
                             <div className="ml-5 rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-xs text-[#FFFFFF]/82">
                               Generating AI draft...
                             </div>
                           ) : null}

                           {draftState?.error ? (
                             <p className="ml-5 text-xs text-[#16DB65] whitespace-pre-line">{draftState.error}</p>
                           ) : null}

                           <AnimatePresence>
                             {hasDraft ? (
                               <motion.div
                                 initial={{ opacity: 0, y: 8 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: 8 }}
                                 transition={{ duration: 0.2, ease: 'easeOut' }}
                                 className="ml-5 rounded-lg border border-[#0A9548]/30 bg-[#0A9548]/8 p-3 space-y-2"
                               >
                                 <div className="flex items-center justify-between gap-2">
                                   <p className="text-[11px] font-semibold uppercase tracking-wide text-[#16DB65]">AI Draft</p>
                                   <p className="text-[11px] text-amber-300/90">Regenerate uses 1 credit</p>
                                 </div>
                                 <p className="text-sm text-white/95 leading-relaxed">{draftState?.draft}</p>
                                 <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => void handleGenerateBulletDraft(exp.id, bulletIndex)}
                                    disabled={Boolean(draftState?.isLoading)}
                                    className="rounded-md border border-white/10 bg-[#0A0F0D] px-3 py-1.5 text-xs font-medium text-[#FFFFFF]/78 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                     Regenerate
                                   </button>
                                   <button
                                     onClick={() => handleAcceptBulletDraft(exp.id, bulletIndex)}
                                     className="rounded-md bg-[#16DB65] px-3 py-1.5 text-xs font-semibold text-[#052A14] hover:bg-[#2AEA7A]"
                                   >
                                     Accept
                                   </button>
                                 </div>
                               </motion.div>
                             ) : null}
                           </AnimatePresence>
                         </div>
                       )
                       })}
                     </div>
                   </div>
                </div>
                )
              })}
            </div>
          )}
```

Replace with:

```tsx
          {activeTab === 'experience' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-(--foreground)">Work Experience</h2>
                <button onClick={handleAddRole} className="text-(--accent) text-sm font-medium hover:text-(--accent-strong)">+ Add Role</button>
              </div>
              
              {resumeData.experience.map((exp, expIndex) => {
                const experienceBullets = getExperienceBullets(exp)
                const globalBulletOffset = resumeData.experience
                  .slice(0, expIndex)
                  .reduce((sum, e) => sum + getExperienceBullets(e).length, 0)

                return (
                 <div key={exp.id} className="bg-(--surface) border border-(--border) rounded-xl p-4 hover:border-(--accent-strong)/60 transition-colors" suppressHydrationWarning>
                   <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                     <p className="text-xs uppercase tracking-wide text-(--muted)">Experience Entry</p>
                     <div className="flex gap-2" suppressHydrationWarning>
                       <button 
                         onClick={() => handleDeleteExperience(exp.id)}
                         disabled={isPending}
                         className="text-(--accent-strong) hover:text-(--accent) p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isPending ? <div className="w-4 h-4 border-2 border-(--accent-strong) border-t-transparent rounded-full animate-spin"></div> : <Trash2 className="w-4 h-4" />}
                       </button>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <input
                       value={exp.title}
                       onChange={(e) => updateExperienceMetaField(exp.id, 'title', e.target.value)}
                       className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                       placeholder="Role title"
                     />
                     <input
                       value={exp.company}
                       onChange={(e) => updateExperienceMetaField(exp.id, 'company', e.target.value)}
                       className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                       placeholder="Company"
                     />
                     <MonthYearRangeField
                       monthLabels={MONTH_LABELS}
                       startMonth={exp.startMonth}
                       startYear={exp.startYear}
                       endMonth={exp.endMonth}
                       endYear={exp.endYear}
                       isCurrent={exp.isCurrent ?? false}
                       onStartMonthChange={(value) => updateExperienceDateField(exp.id, 'startMonth', value)}
                       onStartYearChange={(value) => updateExperienceDateField(exp.id, 'startYear', value)}
                       onEndMonthChange={(value) => updateExperienceDateField(exp.id, 'endMonth', value)}
                       onEndYearChange={(value) => updateExperienceDateField(exp.id, 'endYear', value)}
                       onIsCurrentChange={(value) => updateExperienceDateField(exp.id, 'isCurrent', value)}
                     />

                     <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <p className="text-xs uppercase tracking-wide text-(--muted)">Impact Bullets</p>
                         <button
                           onClick={() => addExperienceBullet(exp.id)}
                           className="text-xs font-medium text-(--accent) hover:text-(--accent-strong)"
                         >
                           + Add Bullet
                         </button>
                       </div>

                       {experienceBullets.map((bullet, bulletIndex) => {
                         const globalIdx = globalBulletOffset + bulletIndex
                         const isHighlighted = highlightedBulletIndex === globalIdx
                         const draftKey = getBulletFieldKey(exp.id, bulletIndex)
                         const draftState = bulletDraftStates[draftKey]
                         const hasDraft = Boolean(draftState?.draft?.trim())
                         return (
                         <div key={`${exp.id}-bullet-${bulletIndex}`} className="space-y-2">
                           <motion.div
                             initial={{ opacity: 0, y: 8 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ duration: 0.2, ease: 'easeOut' }}
                             className="flex items-start gap-2"
                           >
                             <span className="pt-9 text-(--accent)">•</span>
                             <RichTextarea
                               ref={(node) => {
                                 bulletFieldRefs.current[draftKey] = node
                               }}
                               data-bullet-global-index={globalIdx}
                               value={bullet}
                               onValueChange={(value) => updateExperienceBulletField(exp.id, bulletIndex, value)}
                               className={`h-20 w-full resize-none rounded-lg border bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:outline-none transition-colors ${
                                 isHighlighted
                                   ? 'border-(--accent-strong) ring-2 ring-(--accent-strong)/40 focus:border-(--accent-strong)'
                                   : 'border-(--border) focus:border-(--accent-strong)'
                               }`}
                               placeholder="Describe measurable impact"
                               toolbarLabel="Bullet formatting"
                             />
                             <div className="flex flex-col gap-1 pt-7">
                               <button
                                 onClick={() => void handleGenerateBulletDraft(exp.id, bulletIndex)}
                                 disabled={Boolean(draftState?.isLoading)}
                                 className="rounded-md border border-(--accent)/40 px-2 py-1 text-[11px] text-(--accent) hover:bg-(--accent-muted) disabled:cursor-not-allowed disabled:opacity-70"
                               >
                                 {draftState?.isLoading ? 'AI...' : 'AI Draft'}
                               </button>
                               <button
                                 onClick={() => removeExperienceBullet(exp.id, bulletIndex)}
                                 disabled={experienceBullets.length === 1}
                                 className="rounded-md border border-(--accent-strong)/35 px-2 py-1 text-[11px] text-(--accent-strong) hover:bg-(--accent)/12 disabled:cursor-not-allowed disabled:opacity-40"
                               >
                                 Del
                               </button>
                             </div>
                           </motion.div>

                           <p className="pl-5 text-[11px] text-amber-300/90">
                             AI Draft and Regenerate each consume 1 bullet rewrite credit.
                           </p>

                           {draftState?.isLoading ? (
                             <div className="ml-5 rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-xs text-(--muted)">
                               Generating AI draft...
                             </div>
                           ) : null}

                           {draftState?.error ? (
                             <p className="ml-5 text-xs text-red-400 whitespace-pre-line">{draftState.error}</p>
                           ) : null}

                           <AnimatePresence>
                             {hasDraft ? (
                               <motion.div
                                 initial={{ opacity: 0, y: 8 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: 8 }}
                                 transition={{ duration: 0.2, ease: 'easeOut' }}
                                 className="ml-5 rounded-lg border border-(--accent)/30 bg-(--accent)/8 p-3 space-y-2"
                               >
                                 <div className="flex items-center justify-between gap-2">
                                   <p className="text-[11px] font-semibold uppercase tracking-wide text-(--accent-strong)">AI Draft</p>
                                   <p className="text-[11px] text-amber-300/90">Regenerate uses 1 credit</p>
                                 </div>
                                 <p className="text-sm text-(--foreground)/95 leading-relaxed">{draftState?.draft}</p>
                                 <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => void handleGenerateBulletDraft(exp.id, bulletIndex)}
                                    disabled={Boolean(draftState?.isLoading)}
                                    className="rounded-md border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--muted) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                     Regenerate
                                   </button>
                                   <button
                                     onClick={() => handleAcceptBulletDraft(exp.id, bulletIndex)}
                                     className="rounded-md bg-(--accent-strong) px-3 py-1.5 text-xs font-semibold text-(--background) hover:bg-(--accent)"
                                   >
                                     Accept
                                   </button>
                                 </div>
                               </motion.div>
                             ) : null}
                           </AnimatePresence>
                         </div>
                       )
                       })}
                     </div>
                   </div>
                </div>
                )
              })}
            </div>
          )}
```

Implementer notes:
- **Bug fix**: `draftState?.error` (the AI bullet-draft error message, e.g. "Add bullet text before generating an AI draft.") was rendered in `text-[#16DB65]` — the same error-colored-as-success bug, fixed to `text-red-400`.
- `amber-300/90` credit-consumption warning text is left as a literal Tailwind utility (no semantic warning token exists yet, per Phase 0's documented deferral — same as `AlertModal`'s `text-yellow-500` icon).
- `hover:border-[#16DB65]/60` → `hover:border-(--accent-strong)/60` preserves the exact alpha suffix.

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/ResumeBuilder.tsx
git commit -m "feat(builder): restyle Personal Info + Experience tabs with tokens; fix 2 error-color bugs"
```

---

### Task 5: Restyle Projects + Education tab content

**Files:**
- Modify: `src/components/builder/ResumeBuilder.tsx` (two regions — Projects tab, then Education tab)

**Interfaces:** none new. All handlers (`handleAddProject`, `deleteProject`, `updateProjectField`, `updateProjectDateField`, `updateProjectTechnologies`, `getProjectTechnologies`, `handleAddEducation`, `deleteEducation`, `updateEducationField`, `updateEducationDateField`) and state reads (`resumeData.projects`, `resumeData.education`) consumed exactly as before.

- [ ] **Step 1: Read the current file first**

Read `src/components/builder/ResumeBuilder.tsx` to confirm current line numbers for the `{activeTab === 'projects' && (` block through the end of `{activeTab === 'education' && (` block (originally lines 1821-1993).

- [ ] **Step 2: Apply the color-only edit — Projects tab**

Find this exact block (originally lines 1821-1905):

```tsx
          {activeTab === 'projects' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Projects</h2>
                  <p className="mt-1 text-sm text-[#FFFFFF]/72">Manage your imported and manual projects here. These are rendered separately from custom sections.</p>
                </div>
                <button onClick={handleAddProject} className="text-[#0A9548] text-sm font-medium hover:text-[#16DB65]">+ Add Project</button>
              </div>

              {resumeData.projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-[#FFFFFF]/82">
                  No projects yet. Add one to keep it separate from custom sections.
                </div>
              ) : (
                resumeData.projects.map((project, index) => (
                  <div key={project.id} className="bg-[#0A0F0D] border border-white/10 rounded-xl p-4 hover:border-[#16DB65]/60 transition-colors" suppressHydrationWarning>
                    <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                      <p className="text-xs uppercase tracking-wide text-[#FFFFFF]/82">Project {index + 1}</p>
                      <div className="flex gap-2" suppressHydrationWarning>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-[#16DB65] hover:text-[#2AEA7A] p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        value={project.name}
                        onChange={(e) => updateProjectField(project.id, { name: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                        placeholder="Project name"
                      />

                      <input
                        value={project.role || ''}
                        onChange={(e) => updateProjectField(project.id, { role: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                        placeholder="Role / Title (e.g. Solo Founder, Lead Developer)"
                      />

                      <MonthYearRangeField
                        monthLabels={MONTH_LABELS}
                        startMonth={project.startMonth}
                        startYear={project.startYear}
                        endMonth={project.endMonth}
                        endYear={project.endYear}
                        isCurrent={project.isCurrent ?? false}
                        onStartMonthChange={(value) => updateProjectDateField(project.id, 'startMonth', value)}
                        onStartYearChange={(value) => updateProjectDateField(project.id, 'startYear', value)}
                        onEndMonthChange={(value) => updateProjectDateField(project.id, 'endMonth', value)}
                        onEndYearChange={(value) => updateProjectDateField(project.id, 'endYear', value)}
                        onIsCurrentChange={(value) => updateProjectDateField(project.id, 'isCurrent', value)}
                      />

                      <RichTextarea
                        value={project.description}
                        onValueChange={(value) => updateProjectField(project.id, { description: value })}
                        className="h-32 w-full resize-y rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                        placeholder={`Describe what you built, shipped, or learned. Tip: each line becomes its own bullet, e.g.:\n• Built X\n• Deployed Y\n• Reduced cost by 40%`}
                        toolbarLabel="Project description formatting"
                      />

                      <input
                        value={getProjectTechnologies(project).join(', ')}
                        onChange={(e) => updateProjectTechnologies(project.id, e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                        placeholder="Technologies separated by commas (React, Node.js, AWS)"
                      />

                      <input
                        value={project.url || ''}
                        onChange={(e) => updateProjectField(project.id, { url: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                        placeholder="Project URL or GitHub link"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
```

Replace with:

```tsx
          {activeTab === 'projects' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-(--foreground)">Projects</h2>
                  <p className="mt-1 text-sm text-(--muted)">Manage your imported and manual projects here. These are rendered separately from custom sections.</p>
                </div>
                <button onClick={handleAddProject} className="text-(--accent) text-sm font-medium hover:text-(--accent-strong)">+ Add Project</button>
              </div>

              {resumeData.projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--border) p-5 text-sm text-(--muted)">
                  No projects yet. Add one to keep it separate from custom sections.
                </div>
              ) : (
                resumeData.projects.map((project, index) => (
                  <div key={project.id} className="bg-(--surface) border border-(--border) rounded-xl p-4 hover:border-(--accent-strong)/60 transition-colors" suppressHydrationWarning>
                    <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                      <p className="text-xs uppercase tracking-wide text-(--muted)">Project {index + 1}</p>
                      <div className="flex gap-2" suppressHydrationWarning>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-(--accent-strong) hover:text-(--accent) p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        value={project.name}
                        onChange={(e) => updateProjectField(project.id, { name: e.target.value })}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Project name"
                      />

                      <input
                        value={project.role || ''}
                        onChange={(e) => updateProjectField(project.id, { role: e.target.value })}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Role / Title (e.g. Solo Founder, Lead Developer)"
                      />

                      <MonthYearRangeField
                        monthLabels={MONTH_LABELS}
                        startMonth={project.startMonth}
                        startYear={project.startYear}
                        endMonth={project.endMonth}
                        endYear={project.endYear}
                        isCurrent={project.isCurrent ?? false}
                        onStartMonthChange={(value) => updateProjectDateField(project.id, 'startMonth', value)}
                        onStartYearChange={(value) => updateProjectDateField(project.id, 'startYear', value)}
                        onEndMonthChange={(value) => updateProjectDateField(project.id, 'endMonth', value)}
                        onEndYearChange={(value) => updateProjectDateField(project.id, 'endYear', value)}
                        onIsCurrentChange={(value) => updateProjectDateField(project.id, 'isCurrent', value)}
                      />

                      <RichTextarea
                        value={project.description}
                        onValueChange={(value) => updateProjectField(project.id, { description: value })}
                        className="h-32 w-full resize-y rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={`Describe what you built, shipped, or learned. Tip: each line becomes its own bullet, e.g.:\n• Built X\n• Deployed Y\n• Reduced cost by 40%`}
                        toolbarLabel="Project description formatting"
                      />

                      <input
                        value={getProjectTechnologies(project).join(', ')}
                        onChange={(e) => updateProjectTechnologies(project.id, e.target.value)}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Technologies separated by commas (React, Node.js, AWS)"
                      />

                      <input
                        value={project.url || ''}
                        onChange={(e) => updateProjectField(project.id, { url: e.target.value })}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Project URL or GitHub link"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
```

- [ ] **Step 3: Apply the color-only edit — Education tab**

Find this exact block (originally lines 1907-1993):

```tsx
          {activeTab === 'education' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Education</h2>
                  <p className="mt-1 text-sm text-[#FFFFFF]/72">Add each institution as a separate entry. Use the date pickers for graduation timelines.</p>
                </div>
                <button onClick={handleAddEducation} className="text-[#0A9548] text-sm font-medium hover:text-[#16DB65]">+ Add Institution</button>
              </div>

              {resumeData.education.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-[#FFFFFF]/82">
                  No education entries yet. Click + Add Institution to add your first one.
                </div>
              ) : (
                resumeData.education.map((entry, index) => (
                  <div key={entry.id} className="bg-[#0A0F0D] border border-white/10 rounded-xl p-4 hover:border-[#16DB65]/60 transition-colors" suppressHydrationWarning>
                    <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                      <p className="text-xs uppercase tracking-wide text-[#FFFFFF]/82">Institution {index + 1}</p>
                      <div className="flex gap-2" suppressHydrationWarning>
                        <button
                          onClick={() => deleteEducation(entry.id)}
                          className="text-[#16DB65] hover:text-[#2AEA7A] p-1"
                          aria-label="Delete education entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        value={entry.institution}
                        onChange={(e) => updateEducationField(entry.id, 'institution', e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                        placeholder="Institution (e.g. Stanford University)"
                      />

                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={entry.degree || ''}
                          onChange={(e) => updateEducationField(entry.id, 'degree', e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                          placeholder="Degree (e.g. B.Sc. in Computer Science)"
                        />
                        <input
                          value={entry.field || ''}
                          onChange={(e) => updateEducationField(entry.id, 'field', e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                          placeholder="Field of study (optional)"
                        />
                      </div>

                      <input
                        value={entry.location || ''}
                        onChange={(e) => updateEducationField(entry.id, 'location', e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                        placeholder="Location (optional, e.g. Stanford, CA)"
                      />

                      <MonthYearRangeField
                        monthLabels={MONTH_LABELS}
                        startMonth={entry.startMonth}
                        startYear={entry.startYear}
                        endMonth={entry.endMonth}
                        endYear={entry.endYear}
                        isCurrent={entry.isCurrent ?? false}
                        onStartMonthChange={(value) => updateEducationDateField(entry.id, 'startMonth', value)}
                        onStartYearChange={(value) => updateEducationDateField(entry.id, 'startYear', value)}
                        onEndMonthChange={(value) => updateEducationDateField(entry.id, 'endMonth', value)}
                        onEndYearChange={(value) => updateEducationDateField(entry.id, 'endYear', value)}
                        onIsCurrentChange={(value) => updateEducationDateField(entry.id, 'isCurrent', value)}
                      />

                      <RichTextarea
                        value={entry.description || ''}
                        onValueChange={(value) => updateEducationField(entry.id, 'description', value)}
                        className="h-24 w-full resize-y rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                        placeholder="Optional details (GPA, honors, relevant coursework, thesis, ...)"
                        toolbarLabel="Education description formatting"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
```

Replace with:

```tsx
          {activeTab === 'education' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-(--foreground)">Education</h2>
                  <p className="mt-1 text-sm text-(--muted)">Add each institution as a separate entry. Use the date pickers for graduation timelines.</p>
                </div>
                <button onClick={handleAddEducation} className="text-(--accent) text-sm font-medium hover:text-(--accent-strong)">+ Add Institution</button>
              </div>

              {resumeData.education.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--border) p-5 text-sm text-(--muted)">
                  No education entries yet. Click + Add Institution to add your first one.
                </div>
              ) : (
                resumeData.education.map((entry, index) => (
                  <div key={entry.id} className="bg-(--surface) border border-(--border) rounded-xl p-4 hover:border-(--accent-strong)/60 transition-colors" suppressHydrationWarning>
                    <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                      <p className="text-xs uppercase tracking-wide text-(--muted)">Institution {index + 1}</p>
                      <div className="flex gap-2" suppressHydrationWarning>
                        <button
                          onClick={() => deleteEducation(entry.id)}
                          className="text-(--accent-strong) hover:text-(--accent) p-1"
                          aria-label="Delete education entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        value={entry.institution}
                        onChange={(e) => updateEducationField(entry.id, 'institution', e.target.value)}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Institution (e.g. Stanford University)"
                      />

                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={entry.degree || ''}
                          onChange={(e) => updateEducationField(entry.id, 'degree', e.target.value)}
                          className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                          placeholder="Degree (e.g. B.Sc. in Computer Science)"
                        />
                        <input
                          value={entry.field || ''}
                          onChange={(e) => updateEducationField(entry.id, 'field', e.target.value)}
                          className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                          placeholder="Field of study (optional)"
                        />
                      </div>

                      <input
                        value={entry.location || ''}
                        onChange={(e) => updateEducationField(entry.id, 'location', e.target.value)}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Location (optional, e.g. Stanford, CA)"
                      />

                      <MonthYearRangeField
                        monthLabels={MONTH_LABELS}
                        startMonth={entry.startMonth}
                        startYear={entry.startYear}
                        endMonth={entry.endMonth}
                        endYear={entry.endYear}
                        isCurrent={entry.isCurrent ?? false}
                        onStartMonthChange={(value) => updateEducationDateField(entry.id, 'startMonth', value)}
                        onStartYearChange={(value) => updateEducationDateField(entry.id, 'startYear', value)}
                        onEndMonthChange={(value) => updateEducationDateField(entry.id, 'endMonth', value)}
                        onEndYearChange={(value) => updateEducationDateField(entry.id, 'endYear', value)}
                        onIsCurrentChange={(value) => updateEducationDateField(entry.id, 'isCurrent', value)}
                      />

                      <RichTextarea
                        value={entry.description || ''}
                        onValueChange={(value) => updateEducationField(entry.id, 'description', value)}
                        className="h-24 w-full resize-y rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Optional details (GPA, honors, relevant coursework, thesis, ...)"
                        toolbarLabel="Education description formatting"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
```

Implementer notes:
- No bug fixes bundled in this task — every color usage in these two regions was already using the correct semantic (accent for actions/positive states, muted for secondary text), so this is a pure 1:1 token swap.

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/ResumeBuilder.tsx
git commit -m "feat(builder): restyle Projects + Education tabs with tokens"
```

---

### Task 6: Restyle Skills/Certifications/More Sections tab content + `SectionPanel`

**Files:**
- Modify: `src/components/builder/ResumeBuilder.tsx` (one region)
- Modify: `src/components/builder/SectionPanel.tsx` (full replacement)

**Interfaces:** none new. `visibleDynamicSections`, `updateDynamicSection`, `deleteDynamicSection`, `setIsAddModalOpen`, `tabs` consumed exactly as before. `SectionPanel`'s props (`title`, `content`, `showTitleField`, `onTitleChange`, `onContentChange`, `onDelete`) unchanged.

- [ ] **Step 1: Read the current file first**

Read `src/components/builder/ResumeBuilder.tsx` to confirm current line numbers for the `{['skills', 'certifications', 'sections'].includes(activeTab) ? (` block (originally lines 1995-2019).

- [ ] **Step 2: Apply the color-only edit — ResumeBuilder.tsx**

Find this exact block:

```tsx
          {['skills', 'certifications', 'sections'].includes(activeTab) ? (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">{tabs.find((t) => t.id === activeTab)?.label}</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="text-[#0A9548] text-sm font-medium hover:text-[#16DB65]">+ Add Section</button>
              </div>

              {visibleDynamicSections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-[#FFFFFF]/82">
                  No sections yet for this category. Use Add Section to create one.
                </div>
              ) : (
                visibleDynamicSections.map((section) => (
                  <SectionPanel
                    key={section.id}
                    title={section.title}
                    content={section.content}
                    onTitleChange={(value) => updateDynamicSection(section.id, { title: value })}
                    onContentChange={(value) => updateDynamicSection(section.id, { content: value })}
                    onDelete={() => deleteDynamicSection(section.id)}
                  />
                ))
              )}
            </div>
          ) : null}
```

Replace with:

```tsx
          {['skills', 'certifications', 'sections'].includes(activeTab) ? (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-(--foreground)">{tabs.find((t) => t.id === activeTab)?.label}</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="text-(--accent) text-sm font-medium hover:text-(--accent-strong)">+ Add Section</button>
              </div>

              {visibleDynamicSections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--border) p-5 text-sm text-(--muted)">
                  No sections yet for this category. Use Add Section to create one.
                </div>
              ) : (
                visibleDynamicSections.map((section) => (
                  <SectionPanel
                    key={section.id}
                    title={section.title}
                    content={section.content}
                    onTitleChange={(value) => updateDynamicSection(section.id, { title: value })}
                    onContentChange={(value) => updateDynamicSection(section.id, { content: value })}
                    onDelete={() => deleteDynamicSection(section.id)}
                  />
                ))
              )}
            </div>
          ) : null}
```

- [ ] **Step 3: Replace `SectionPanel.tsx`**

```tsx
"use client"

import { Trash2 } from 'lucide-react'

type SectionPanelProps = {
  title: string
  content: string
  showTitleField?: boolean
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onDelete: () => void
}

export function SectionPanel({
  title,
  content,
  showTitleField = true,
  onTitleChange,
  onContentChange,
  onDelete,
}: SectionPanelProps) {
  return (
    <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
      <div className="mb-3 flex items-center gap-2">
        {showTitleField ? (
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
          />
        ) : (
          <div className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground)/80">
            {title || 'Education'}
          </div>
        )}
        <button
          onClick={onDelete}
          className="rounded-md border border-(--accent-strong)/30 bg-(--accent-muted) p-2 text-(--accent-strong) hover:bg-(--accent)/18"
          aria-label="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className="h-28 w-full resize-none rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
        placeholder="Write section content..."
      />
    </div>
  )
}
```

Implementer notes:
- `TemplateSwitcher.tsx` was already restyled as part of Task 3's dependency chain? — **no**, it wasn't; it's a separate component not covered by Task 3's region edit (Task 3 only touched `ResumeBuilder.tsx`'s own JSX, and `TemplateSwitcher` is rendered as a child component with its own file). Restyle it now too, in this same task, since it's small and thematically part of "the rest of the builder's non-tab-content chrome":

```tsx
"use client"

type TemplateValue = 'harvard'

type TemplateSwitcherProps = {
  value: TemplateValue
  onChange: (value: TemplateValue) => void
}

const templates: Array<{ id: TemplateValue; name: string; description: string }> = [
  { id: 'harvard', name: 'Harvard', description: 'Classic academic layout' },
]

export function TemplateSwitcher({ value, onChange }: TemplateSwitcherProps) {
  return (
    <div className="bg-(--surface) border border-(--border) rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-(--muted) mb-3">Template</p>
      <div className="grid grid-cols-1 gap-2.5">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onChange(template.id)}
            className={`text-left rounded-lg border px-3.5 py-2.5 transition-colors ${
              value === template.id
                ? 'bg-(--accent-muted) border-(--border) text-(--foreground)'
                : 'bg-(--surface) border-(--border) text-(--foreground)/72 hover:border-(--accent-strong)/60'
            }`}
          >
            <p className="text-sm font-semibold">{template.name}</p>
            <p className="text-[11px] text-(--muted) mt-0.5">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
```

Save this as a full replacement of `src/components/builder/TemplateSwitcher.tsx`.

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/ResumeBuilder.tsx src/components/builder/SectionPanel.tsx src/components/builder/TemplateSwitcher.tsx
git commit -m "feat(builder): restyle Skills/Certifications/More Sections tab, SectionPanel, TemplateSwitcher with tokens"
```

---

### Task 7: Migrate modals onto the `Modal` primitive

**Scope refinement (decided while writing this task):** `ResumeOnboardingModal` and the inline "importing PDF" loading modal (inside `ResumeBuilder.tsx`) are intentionally **not dismissible** today (no close button, no `onClose` prop) — `ResumeOnboardingModal` is a multi-step wizard with a different heading per step, and the loading modal blocks during an async operation. Forcing either onto the `Modal` primitive (which always renders a close-X) would add a dismiss capability that doesn't exist today — a behavior change, not a restyle. Both are restyled in place instead, keeping their bespoke wrapper markup. Everything else (`AddContentModal`, `UpgradeModal`, `BeforeAfterModal`, and the 3 remaining inline modals in `ResumeBuilder.tsx` — Tailor, upload-warning, import-limit) already has a close affordance and a fixed single title, so all 6 migrate cleanly onto `Modal`.

**Files:**
- Modify: `src/components/builder/AddContentModal.tsx` (full replacement)
- Modify: `src/components/ui/UpgradeModal.tsx` (full replacement)
- Modify: `src/components/ui/BeforeAfterModal.tsx` (full replacement)
- Modify: `src/components/builder/ResumeOnboardingModal.tsx` (full replacement — restyled in place, not migrated to `Modal`)
- Modify: `src/components/builder/ResumeBuilder.tsx` (3 inline-modal regions migrated to `Modal`, 1 inline-modal region — importing-PDF loading — restyled in place)

**Interfaces:** none new. All props on all 4 standalone components stay identical (`AddContentModal`'s `open`/`onClose`/`onAdd`, `UpgradeModal`'s `open`/`title`/`description`/`onClose`/`onUpgrade`, `BeforeAfterModal`'s `patches`/`onClose`, `ResumeOnboardingModal`'s `onStartBlank`/`onImported`).

- [ ] **Step 1: Replace `AddContentModal.tsx`**

```tsx
"use client"

import { Modal } from '@/components/ui/Modal'

export type AddableSectionType =
  | 'professional_summary'
  | 'career_objective'
  | 'education'
  | 'leadership'
  | 'projects'
  | 'research'
  | 'certifications'
  | 'awards'
  | 'publications'
  | 'skills'

export type AddableSection = {
  type: AddableSectionType
  title: string
  description: string
}

const SECTION_OPTIONS: AddableSection[] = [
  { type: 'professional_summary', title: 'Professional Summary', description: 'Concise overview of your profile' },
  { type: 'career_objective', title: 'Career Objective', description: 'Role-focused positioning statement' },
  { type: 'education', title: 'Education', description: 'Degrees and academic background' },
  { type: 'leadership', title: 'Leadership', description: 'Leadership and ownership examples' },
  { type: 'projects', title: 'Projects', description: 'Notable projects and outcomes' },
  { type: 'research', title: 'Research', description: 'Research work and findings' },
  { type: 'certifications', title: 'Certifications', description: 'Professional certifications' },
  { type: 'awards', title: 'Awards & Honors', description: 'Awards, scholarships, distinctions' },
  { type: 'publications', title: 'Publications', description: 'Articles and publications' },
  { type: 'skills', title: 'Skills', description: 'Technical and professional skills' },
]

type AddContentModalProps = {
  open: boolean
  onClose: () => void
  onAdd: (section: AddableSection) => void
}

export function AddContentModal({ open, onClose, onAdd }: AddContentModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Add Content Section" maxWidth="2xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTION_OPTIONS.map((item) => (
          <button
            key={item.type}
            onClick={() => onAdd(item)}
            className="rounded-xl border border-(--border) bg-(--surface) p-4 text-left transition-colors hover:border-(--accent-strong)/60 hover:bg-(--surface-elevated)"
          >
            <p className="text-sm font-semibold text-(--foreground)">{item.title}</p>
            <p className="mt-1 text-xs text-(--muted)">{item.description}</p>
          </button>
        ))}
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Replace `src/components/ui/UpgradeModal.tsx`**

```tsx
"use client"

import { useState } from 'react'
import { Crown } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'

type UpgradeModalProps = {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
  onUpgrade: () => Promise<void>
}

export function UpgradeModal({
  open,
  title = 'Upgrade to Pro',
  description = 'Unlock unlimited AI actions and premium optimization tools.',
  onClose,
  onUpgrade,
}: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false)

  async function handleUpgrade() {
    setIsUpgrading(true)
    try {
      await onUpgrade()
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
          >
            Maybe Later
          </button>
          <button
            onClick={() => void handleUpgrade()}
            disabled={isUpgrading}
            className={`disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
          >
            {isUpgrading ? 'Redirecting...' : 'Upgrade to Pro'}
          </button>
        </div>
      }
    >
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--accent-strong)/35 bg-(--accent-muted) text-(--accent-strong)">
        <Crown className="h-5 w-5" />
      </div>

      <p className="text-sm text-(--foreground)/72">{description}</p>

      <div className="mt-5 rounded-xl border border-(--border) bg-(--surface) p-4 text-sm text-(--foreground)/72">
        <p>Pro includes:</p>
        <p className="mt-2">Unlimited AI analysis and tailoring</p>
        <p>Advanced rewrite and bullet optimization</p>
        <p>Priority generation and premium templates</p>
      </div>
    </Modal>
  )
}
```

Implementer note: the original rendered `title` a second time as a large `<h3>` inside the card body (in addition to the header). Since `Modal`'s header already shows `title`, the body no longer repeats it — this avoids a duplicated heading, not a content loss.

- [ ] **Step 3: Replace `src/components/ui/BeforeAfterModal.tsx`**

```tsx
"use client"

import { ArrowDown } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'

export type FixPatchWithContext = {
  experienceId: string
  bulletIndex: number
  originalBullet: string
  updatedBullet: string
  experienceTitle?: string
  company?: string
}

type BeforeAfterModalProps = {
  patches: FixPatchWithContext[]
  onClose: () => void
}

export function BeforeAfterModal({ patches, onClose }: BeforeAfterModalProps) {
  const count = patches.length

  return (
    <Modal
      open
      onClose={onClose}
      title={`AI Applied ${count} ${count === 1 ? 'Improvement' : 'Improvements'}`}
      maxWidth="xl"
      footer={
        <button onClick={onClose} className={`w-full ${buttonVariants('primary', 'md')}`}>
          View in Editor
        </button>
      }
    >
      <div className="space-y-4">
        {patches.map((patch, idx) => (
          <div
            key={`${patch.experienceId}-${patch.bulletIndex}-${idx}`}
            className="rounded-xl border border-(--border) overflow-hidden"
          >
            {(patch.experienceTitle || patch.company) && (
              <div className="px-4 py-2 bg-(--surface-elevated) border-b border-(--border)">
                <p className="text-xs font-medium text-(--muted)">
                  {[patch.experienceTitle, patch.company].filter(Boolean).join(' · ')}
                </p>
              </div>
            )}

            <div className="p-4 space-y-2">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-(--accent-strong) font-semibold mb-1.5">Before</p>
                <p className="text-sm bg-(--accent-muted) text-(--foreground) border-l-2 border-(--accent-strong) px-3 py-2 rounded-r leading-relaxed">
                  {patch.originalBullet || <span className="italic opacity-60">(empty)</span>}
                </p>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-(--muted)" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-(--accent) font-semibold mb-1.5">After</p>
                <p className="text-sm bg-(--accent-muted) text-(--accent-strong) border-l-2 border-(--accent) px-3 py-2 rounded-r leading-relaxed">
                  {patch.updatedBullet}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
```

Implementer notes:
- **Bug fix**: the original separator was `' Â· '` — a mojibake artifact (a UTF-8 middot re-encoded as Latin-1), not the intended `' · '` character. Fixed to a literal `·`.
- `BeforeAfterModal` has no `open` prop — its parent (`ResumeBuilder.tsx`) already only mounts it conditionally (`{showBeforeAfterModal && fixPatches.length > 0 && (<BeforeAfterModal .../>)}`), so `Modal`'s required `open` prop is passed as the literal `open` (shorthand for `open={true}`), preserving the existing conditional-mount behavior exactly.
- Original `text-[#C8FFD9]` (light minty green) for "Before" text had no equivalent token; mapped to `text-(--foreground)` (neutral/readable) to keep the Before/After visual distinction resting on the accent-colored "After" text instead of inventing a new ad-hoc color.

- [ ] **Step 4: Migrate 3 inline modals inside `ResumeBuilder.tsx`**

Read `src/components/builder/ResumeBuilder.tsx` to confirm current line numbers for the Tailor modal, upload-warning modal, and import-limit modal blocks (originally lines 2057-2147, immediately after the `AddContentModal` render and before `showBeforeAfterModal`/`isImportingPdf`/`UpgradeModal`).

Find this exact block:

```tsx
      {isTailorModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIsTailorModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0A0F0D] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">AI Resume Tailor</h3>
            <p className="mt-1 text-sm text-[#FFFFFF]/82">Paste a job description and tailor your resume bullets for this role.</p>

            <textarea
              value={tailorJobDescription}
              onChange={(e) => setTailorJobDescription(e.target.value)}
              className="mt-4 h-52 w-full resize-none rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
              placeholder="Paste job description here..."
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsTailorModalOpen(false)}
                className="rounded-lg border border-white/10 bg-[#0A0F0D] px-4 py-2 text-sm text-[#FFFFFF]/72"
              >
                Cancel
              </button>
              <FeatureButton
                feature="jds"
                onClick={handleTailorResume}
                disabled={isTailoring}
                className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Sparkles className="h-4 w-4" />
                {isTailoring ? 'Tailoring...' : 'Apply Tailoring'}
              </FeatureButton>
            </div>
          </div>
        </div>
      ) : null}

      {showBeforeAfterModal && fixPatches.length > 0 && (
        <BeforeAfterModal patches={fixPatches} onClose={() => setShowBeforeAfterModal(false)} />
      )}

      {showUploadWarning ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={cancelUpload} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0F0D] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Before you upload</h3>
            <p className="mt-2 text-sm text-[#FFFFFF]/82">
              For best results, upload a digitally generated PDF or DOCX file. Scanned documents or photos of CVs may produce incomplete results.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={cancelUpload}
                className="rounded-lg border border-white/10 bg-[#0A0F0D] px-4 py-2 text-sm text-[#FFFFFF]/72"
              >
                Cancel
              </button>
              <button
                onClick={finalizeUpload}
                disabled={isImportingPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isImportingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  'Got it, continue'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showImportLimitModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeImportLimitModal} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0F0D] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Import limit reached</h3>
            <p className="mt-2 text-sm text-[#FFFFFF]/82">
              {MAX_FILES_ERROR_MESSAGE}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeImportLimitModal}
                className="rounded-lg bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isImportingPdf ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0A0F0D] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#16DB65]" />
              <div>
                <p className="text-sm font-semibold text-white">Importing PDF/DOCX</p>
                <p className="text-xs text-[#FFFFFF]/72">Parsing your resume. This can take a moment.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
```

Replace with:

```tsx
      <Modal
        open={isTailorModalOpen}
        onClose={() => setIsTailorModalOpen(false)}
        title="AI Resume Tailor"
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsTailorModalOpen(false)}
              className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
            >
              Cancel
            </button>
            <FeatureButton
              feature="jds"
              onClick={handleTailorResume}
              disabled={isTailoring}
              className={`inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
            >
              <Sparkles className="h-4 w-4" />
              {isTailoring ? 'Tailoring...' : 'Apply Tailoring'}
            </FeatureButton>
          </div>
        }
      >
        <p className="text-sm text-(--muted)">Paste a job description and tailor your resume bullets for this role.</p>

        <textarea
          value={tailorJobDescription}
          onChange={(e) => setTailorJobDescription(e.target.value)}
          className="mt-4 h-52 w-full resize-none rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
          placeholder="Paste job description here..."
        />
      </Modal>

      {showBeforeAfterModal && fixPatches.length > 0 && (
        <BeforeAfterModal patches={fixPatches} onClose={() => setShowBeforeAfterModal(false)} />
      )}

      <Modal
        open={showUploadWarning}
        onClose={cancelUpload}
        title="Before you upload"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={cancelUpload}
              className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
            >
              Cancel
            </button>
            <button
              onClick={finalizeUpload}
              disabled={isImportingPdf}
              className={`inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
            >
              {isImportingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                'Got it, continue'
              )}
            </button>
          </div>
        }
      >
        <p className="text-sm text-(--muted)">
          For best results, upload a digitally generated PDF or DOCX file. Scanned documents or photos of CVs may produce incomplete results.
        </p>
      </Modal>

      <Modal
        open={showImportLimitModal}
        onClose={closeImportLimitModal}
        title="Import limit reached"
        maxWidth="md"
        footer={
          <button onClick={closeImportLimitModal} className={buttonVariants('primary', 'md')}>
            Got it
          </button>
        }
      >
        <p className="text-sm text-(--muted)">{MAX_FILES_ERROR_MESSAGE}</p>
      </Modal>

      {isImportingPdf ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-(--accent-strong)" />
              <div>
                <p className="text-sm font-semibold text-(--foreground)">Importing PDF/DOCX</p>
                <p className="text-xs text-(--muted)">Parsing your resume. This can take a moment.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
```

Implementer notes:
- Add `import { Modal } from '@/components/ui/Modal'` and `import { buttonVariants } from '@/components/ui/Button'` to `ResumeBuilder.tsx`'s import block.
- The importing-PDF loading block is deliberately **not** migrated to `Modal` (see Scope refinement above) — it has no close affordance today and must not gain one, since it represents a blocking async operation.
- `Import limit reached` modal's original single button used the primary gradient directly (no Cancel) — preserved that single-button footer shape, just tokenized via `buttonVariants('primary', 'md')`.

- [ ] **Step 5: Restyle `ResumeOnboardingModal.tsx` in place (not migrated to `Modal`)**

```tsx
"use client"
import { useRef, useState } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'
import type { ResumeTemplateData } from '@/components/templates/types'
import { importPdfClientSide } from '@/lib/pdf-import'
import { AlertModal } from '@/components/ui/AlertModal'

const MAX_FILES_PER_SLOT = 3
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_EXTENSIONS = ['.pdf', '.docx']

type Props = {
  onStartBlank: (firstName: string, lastName: string, title: string) => void
  onImported: (data: ResumeTemplateData) => void
}

type Step = 'choose' | 'blank-form' | 'importing' | 'error' | 'show-alert'


function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  if (index < 0) return ''
  return fileName.slice(index).toLowerCase()
}

function isValidResumeFile(file: File): boolean {
  const extension = getFileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(extension)) return false
  if (!file.type) return true
  return ALLOWED_TYPES.includes(file.type)
}

export function ResumeOnboardingModal({ onStartBlank, onImported }: Props) {
  const [step, setStep] = useState<Step>('choose')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [uploadedImportFiles, setUploadedImportFiles] = useState<File[]>([])
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)

  const validateUploadFile = (file: File) => {
    if (!isValidResumeFile(file)) {
      setAlertMessage('Only PDF and DOCX files are allowed.')
      return false
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAlertMessage('File must be under 5 MB.')
      return false
    }

    if (uploadedImportFiles.length >= MAX_FILES_PER_SLOT) {
      setAlertMessage(`You can upload a maximum of ${MAX_FILES_PER_SLOT} CVs per slot.`)
      return false
    }

    return true
  }

  const handlePdfSelect = async (file: File) => {
    setStep('importing')
    try {
      const result = await importPdfClientSide(file)
      setUploadedImportFiles(prev => [...prev, file])
      onImported(result.data)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed. Please try again.')
      setStep('error')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (validateUploadFile(file)) {
        setPendingUploadFile(file)
        setAlertMessage('For best results, upload a digitally generated PDF or DOCX file. Scanned documents or photos of CVs may produce incomplete results.')
        setShowAlert(true)
      }
      // Reset input to allow selecting the same file again
      e.currentTarget.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      if (validateUploadFile(file)) {
        setPendingUploadFile(file)
        setAlertMessage('For best results, upload a digitally generated PDF or DOCX file. Scanned documents or photos of CVs may produce incomplete results.')
        setShowAlert(true)
      }
    }
  }

  const handleAlertConfirm = () => {
    setShowAlert(false)
    if (pendingUploadFile) {
      void handlePdfSelect(pendingUploadFile)
    }
  }

  const handleAlertCancel = () => {
    setShowAlert(false)
    setPendingUploadFile(null)
    setStep('choose')
  }

  const handleBlankSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStartBlank(firstName.trim(), lastName.trim(), jobTitle.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-(--surface) border border-(--border) rounded-2xl w-full max-w-lg mx-4 p-8 shadow-2xl">

        {showAlert && (
          <AlertModal
            isOpen={showAlert}
            onConfirm={handleAlertConfirm}
            onCancel={handleAlertCancel}
            title={alertMessage}
          />
        )}

        {step === 'choose' && (
          <>
            <h2 className="text-2xl font-bold text-(--foreground) mb-2">Create your resume</h2>
            <p className="text-(--muted) text-sm mb-8">Start from scratch or import an existing PDF resume.</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep('blank-form')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-(--border) bg-(--surface-elevated) hover:bg-(--surface-elevated) hover:border-(--accent-strong)/40 transition-all text-center group"
              >
                <FileText className="w-8 h-8 text-(--muted) group-hover:text-(--foreground) transition-colors" />
                <div>
                  <p className="text-(--foreground) font-medium text-sm">Start from scratch</p>
                  <p className="text-(--muted) text-xs mt-1">Build a new resume</p>
                </div>
              </button>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-dashed border-(--border) bg-(--surface-elevated) hover:bg-(--surface-elevated) hover:border-(--accent-strong)/60 transition-all text-center group cursor-pointer"
              >
                <Upload className="w-8 h-8 text-(--muted) group-hover:text-(--foreground) transition-colors" />
                <div>
                  <p className="text-(--foreground) font-medium text-sm">Import PDF</p>
                  <p className="text-(--muted) text-xs mt-1">AI parses your resume</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </>
        )}

        {step === 'blank-form' && (
          <>
            <h2 className="text-2xl font-bold text-(--foreground) mb-2">Let&apos;s get started</h2>
            <p className="text-(--muted) text-sm mb-8">Just the basics — you&apos;ll fill in everything else in the editor.</p>

            <form onSubmit={handleBlankSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-(--muted) text-xs font-medium uppercase tracking-wide">First Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="bg-(--surface-elevated) border border-(--border) rounded-lg px-3 py-2.5 text-(--foreground) text-sm placeholder:text-(--muted) focus:outline-none focus:border-(--accent-strong)"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-(--muted) text-xs font-medium uppercase tracking-wide">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="bg-(--surface-elevated) border border-(--border) rounded-lg px-3 py-2.5 text-(--foreground) text-sm placeholder:text-(--muted) focus:outline-none focus:border-(--accent-strong)"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-(--muted) text-xs font-medium uppercase tracking-wide">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Software Engineer"
                  className="bg-(--surface-elevated) border border-(--border) rounded-lg px-3 py-2.5 text-(--foreground) text-sm placeholder:text-(--muted) focus:outline-none focus:border-(--accent-strong)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="flex-1 py-2.5 rounded-lg border border-(--border) text-(--muted) text-sm hover:text-(--foreground) hover:border-(--accent-strong)/40 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-(--accent) text-(--background) text-sm font-semibold hover:bg-(--accent-strong) transition-colors"
                >
                  Open Editor
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 text-(--foreground) animate-spin" />
            <div className="text-center">
              <p className="text-(--foreground) font-medium">Importing your resume&hellip;</p>
              <p className="text-(--muted) text-sm mt-1">AI is extracting your information</p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-center">
              <p className="text-(--foreground) font-medium">Import failed</p>
              <p className="text-(--muted) text-sm mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 py-2.5 rounded-lg border border-(--border) text-(--muted) text-sm hover:text-(--foreground) hover:border-(--accent-strong)/40 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => setStep('blank-form')}
                className="flex-1 py-2.5 rounded-lg bg-(--accent) text-(--background) text-sm font-semibold hover:bg-(--accent-strong) transition-colors"
              >
                Start from scratch
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
```

Implementer notes:
- All 4 `step` states, `AlertModal` nesting, drag/drop and file-picker logic, and both callback props are byte-for-byte unchanged — only `className` values changed.
- `bg-[#111]` → `bg-(--surface)` (closest existing surface token; `#111` was a one-off not used to define any Phase 0 token).

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 7: Commit**

```bash
git add src/components/builder/AddContentModal.tsx src/components/ui/UpgradeModal.tsx src/components/ui/BeforeAfterModal.tsx src/components/builder/ResumeBuilder.tsx src/components/builder/ResumeOnboardingModal.tsx
git commit -m "feat(builder): migrate 6 modals onto Modal primitive; restyle ResumeOnboardingModal + importing-PDF modal in place; fix mojibake middot"
```

---

