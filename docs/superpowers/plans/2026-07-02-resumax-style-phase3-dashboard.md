# ResuMax-Style Redesign — Phase 3: Dashboard Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a resumax-style left sidebar navigation to the dashboard (desktop only; mobile keeps the existing `Navbar`), and restyle the dashboard page and all 7 of its widget components (`ProfileCompletion`, `StatCards`, `RedeemCodeCard`, `BenchmarkChart`, `WeeklyGoals`, `QuickTip`, `RecentDocuments`) onto Phase 0/1 tokens and primitives — same data, same logic, same interactions, only the visual layer and (for the score gauge) the rendering technique change.

**Architecture:** One new `Sidebar` client component (`src/components/dashboard/Sidebar.tsx`) renders Joben's real nav items (Dashboard/Resumes/Cover Letters/AI Review + Settings), active-route highlighting via `usePathname()`, a "Create New" CTA, and the Clerk `UserButton` — mapped to Joben's actual routes, not resumax's job-search-specific nav (no Atlas/Path/Jobs items, which don't exist in Joben). `src/app/dashboard/page.tsx` becomes `<div className="flex"><Sidebar /><div>...</div></div>`: the existing `Navbar` is kept but wrapped `lg:hidden` (mobile-only fallback, since `Sidebar` is `hidden lg:flex`, desktop-only) — this is additive, not a replacement, so there is no navigation regression on any viewport. All 7 widget components get the same "swap hardcoded hex for CSS custom properties" treatment already applied throughout this redesign, with zero changes to their props, state, data-fetching, or business logic.

**Scope boundary (decided during planning):** This phase only touches `/dashboard` and its own components. `/resumes`, `/cover-letters`, `/ai-review`, and `/settings` keep using `Navbar` exactly as today and are NOT wrapped in `Sidebar` in this phase — extending the sidebar to those pages is a natural follow-up but a separate, larger undertaking (each page has its own existing layout to adapt) and is out of scope here.

## Global Constraints

- This phase touches REAL, data-driven, authenticated pages — not static marketing content. Every task that touches `src/app/dashboard/page.tsx` or a widget component must preserve 100% of the existing data-fetching (`getUserDashboardStats`, `getRecentDocuments`, `getLatestReviewSummary`, `getUserPlan`), conditional rendering (`hasReviewData` branches, empty states), and interactive behavior (streak `localStorage`, redeem-code fetch, tip rotation, dismissible profile-completion banner) exactly as they exist today. This is a visual-only restyle, verified against REAL seeded Supabase data (see Task 6), not just a static screenshot.
- No new npm dependencies.
- Use Phase 0/1 CSS custom properties via Tailwind arbitrary-value syntax instead of hardcoded hex.
- After every task: `npx tsc --noEmit` must pass with no new errors.

---

### Task 1: Create the `Sidebar` component

**Files:**
- Create: `src/components/dashboard/Sidebar.tsx`

**Interfaces:**
- Produces: `export function Sidebar()` — no props, self-contained (reads the current route via `usePathname()`, renders Clerk's `<UserButton/>` directly). Consumed by Task 2.

- [ ] **Step 1: Write the component**

Create `src/components/dashboard/Sidebar.tsx`:

```tsx
"use client"

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { LayoutDashboard, FileText, Mail, FileSearch, Settings, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resumes', label: 'Resumes', icon: FileText },
  { href: '/cover-letters', label: 'Cover Letters', icon: Mail },
  { href: '/ai-review', label: 'AI Review', icon: FileSearch },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-(--border) bg-(--surface) min-h-screen sticky top-0">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image src="/jobeneu_logo.jpg" alt="Joben logo" fill sizes="32px" className="object-cover" />
          </span>
          <span className="text-lg font-bold tracking-tight text-(--foreground)">Joben</span>
        </Link>
        <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8 border border-(--border)' } }} />
      </div>

      <div className="px-5 mb-4">
        <Link href="/resumes/new" className={`w-full justify-center ${buttonVariants('primary', 'sm')}`}>
          <Plus className="w-4 h-4" /> Create New
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-(--accent-muted) text-(--accent)' : 'text-(--muted) hover:bg-(--surface-elevated) hover:text-(--foreground)'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-(--border)">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === '/settings' ? 'bg-(--accent-muted) text-(--accent)' : 'text-(--muted) hover:bg-(--surface-elevated) hover:text-(--foreground)'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
```

Implementer notes:
- `hidden lg:flex` means this renders nothing below the `lg` breakpoint — Task 2 keeps the existing `Navbar` as the mobile/tablet fallback, so there is no viewport where navigation is missing.
- Active-route highlighting uses `pathname.startsWith(\`${item.href}/\`)` in addition to exact match, so e.g. `/resumes/abc123` still highlights the "Resumes" nav item.
- `buttonVariants('primary', 'sm')` (from Phase 0) is reused for the "Create New" link — it returns a class string, safe to use on a plain `<Link>`, not just `<Button>`.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/Sidebar.tsx
git commit -m "feat(dashboard): add Sidebar navigation component"
```

---

### Task 2: Wire `Sidebar` into the dashboard layout and restyle `page.tsx`

**Files:**
- Modify: `src/app/dashboard/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `Sidebar` (Task 1).

- [ ] **Step 1: Replace the file content**

Replace the full content of `src/app/dashboard/page.tsx` with:

```tsx
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { ProfileCompletion } from '@/components/dashboard/ProfileCompletion'
import { StatCards } from '@/components/dashboard/StatCards'
import { WeeklyGoals } from '@/components/dashboard/WeeklyGoals'
import { QuickTip } from '@/components/dashboard/QuickTip'
import { RecentDocuments } from '@/components/dashboard/RecentDocuments'
import { currentUser } from '@clerk/nextjs/server'
import { Plus, FileSearch, Mail } from 'lucide-react'
import Link from 'next/link'

import { getLatestReviewSummary, getRecentDocuments, getUserDashboardStats } from '@/lib/actions/db'
import { dashboardContent } from '@/lib/dashboard-content'
import { BenchmarkChart } from '@/components/dashboard/BenchmarkChart'
import { RedeemCodeCard } from '@/components/dashboard/RedeemCodeCard'
import { getUserPlan } from '@/lib/plans'

const icons: { [key: string]: React.ElementType } = {
  Plus,
  FileSearch,
  Mail,
};

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName || 'There'
  const userId = user?.id || 'guest'
  const userEmailHint = user?.emailAddresses?.[0]?.emailAddress

  const currentPlan = user?.id
    ? await getUserPlan(user.id, userEmailHint)
    : 'free'

  const stats = await getUserDashboardStats(userId)
  const recentDocs = await getRecentDocuments(userId)
  const latestReview = await getLatestReviewSummary(userId)

  const scoreBreakdownData = latestReview?.breakdown || {
    ats: 0,
    content: 0,
    writing: 0,
    match: 0,
    ready: 0,
  }

  const totalScore = latestReview?.totalScore || stats.averageScore || 0
  const hasReviewData = stats.aiReviews > 0 && totalScore > 0
  const latestReviewLabel = latestReview?.resumeTitle?.trim() || 'Latest Reviewed Resume'

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="mb-8" suppressHydrationWarning>
            <h1 className="text-3xl font-bold text-(--foreground) mb-2">{dashboardContent.greeting(firstName)}</h1>
            <p className="text-(--muted)">{dashboardContent.subGreeting}</p>
          </div>

          <ProfileCompletion stats={stats} />
          <RedeemCodeCard currentPlan={currentPlan} />
          <StatCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Industry Benchmark */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border)" suppressHydrationWarning>
              <h3 className="text-lg font-bold text-(--foreground) mb-2">{dashboardContent.industryBenchmark.title}</h3>
              <p className="text-sm text-(--muted) mb-6">{dashboardContent.industryBenchmark.description}</p>
              {hasReviewData ? (
                <BenchmarkChart userScore={totalScore} />
              ) : (
                <div className="h-48 flex items-center justify-center border-2 border-dashed border-(--border) rounded-xl text-(--muted) text-sm">
                  {dashboardContent.industryBenchmark.noData}
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border)" suppressHydrationWarning>
              <h3 className="text-lg font-bold text-(--foreground) mb-6">{dashboardContent.scoreBreakdown.title}</h3>
              {hasReviewData ? (
                <>
                  <div className="space-y-5">
                     {dashboardContent.scoreBreakdown.categories.map((item, i) => {
                       const score = scoreBreakdownData[item.key as keyof typeof scoreBreakdownData];
                       const isWarning = item.key === 'match' && score < 13
                       return (
                         <div key={i}>
                           <div className="flex justify-between text-sm mb-1">
                             <span className="text-(--foreground)">{item.label}</span>
                             <span className="text-(--muted)">{score}/{item.max}</span>
                           </div>
                           <div className="w-full bg-(--background) rounded-full h-2 mb-1">
                             <div className="bg-(--accent) h-2 rounded-full" style={{ width: `${(score/item.max)*100}%` }}></div>
                           </div>
                             {isWarning && <p className="text-xs text-(--accent)">Warning: Better match job keywords</p>}
                         </div>
                       );
                     })}
                  </div>
                  <p className="mt-4 text-xs text-(--muted)">Latest grade: {latestReview?.grade || 'Unknown'}</p>
                  <Link href="/ai-review" className="block mt-2 text-(--accent) text-sm font-medium hover:text-(--accent-strong)">{dashboardContent.scoreBreakdown.cta}</Link>
                </>
              ) : (
                <div className="min-h-50 grid place-items-center">
                  <div className="w-full rounded-xl border-2 border-dashed border-(--border) px-4 py-10 text-center text-sm text-(--muted)">
                    {dashboardContent.scoreBreakdown.noData}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {dashboardContent.quickActions.map((action, index) => {
              const Icon = icons[action.icon];
              return (
                <Link key={index} href={action.href} className={`${
                  action.isPrimary
                    ? 'bg-(--accent) text-(--background) hover:bg-(--accent-strong)'
                    : 'bg-(--surface) border border-(--border) text-(--foreground) hover:border-(--accent)/60'
                } p-6 rounded-2xl font-bold flex items-center justify-between transition-all`} suppressHydrationWarning>
                  <span>{action.label}</span> <Icon className={`w-6 h-6 ${action.isPrimary ? '' : 'text-(--muted)'}`} />
                </Link>
              );
            })}
          </div>

          {/* Bottom 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Your Score Circular Gauge */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border) flex flex-col items-center justify-center text-center" suppressHydrationWarning>
              <h3 className="text-lg font-bold text-(--foreground) mb-6 w-full text-left">{dashboardContent.yourScore.title}</h3>
              {hasReviewData ? (
                <>
                  <div
                    className="relative w-32 h-32 flex items-center justify-center rounded-full mb-4"
                    style={{
                      background: `conic-gradient(var(--accent) ${totalScore}%, color-mix(in srgb, var(--foreground) 10%, transparent) ${totalScore}% 100%)`,
                    }}
                  >
                     <div className="absolute inset-2 rounded-full bg-(--surface)" />
                     <span className="relative text-4xl font-black text-(--foreground)">{totalScore}</span>
                  </div>
                  <p className="text-(--accent) font-bold uppercase tracking-wider text-sm mb-1">{latestReview?.grade || 'Good'}</p>
                  <p className="text-(--muted) text-xs mb-4">{latestReviewLabel}</p>
                  <Link href="/ai-review" className="text-(--accent) hover:text-(--accent-strong) text-sm font-medium">{dashboardContent.yourScore.cta}</Link>
                </>
              ) : (
                <div className="w-full grow flex flex-col items-center justify-center text-(--muted)">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-(--border) flex items-center justify-center mb-4">
                    <span className="text-xl">{dashboardContent.yourScore.noDataSub}</span>
                  </div>
                  <p className="text-sm">{dashboardContent.yourScore.noData}</p>
                </div>
              )}
            </div>

            <WeeklyGoals stats={stats} />
            <QuickTip />
          </div>

          <RecentDocuments recentDocs={recentDocs} />
        </main>
      </div>
    </div>
  )
}
```

Implementer notes:
- ALL data-fetching lines (`currentUser()`, `getUserPlan`, `getUserDashboardStats`, `getRecentDocuments`, `getLatestReviewSummary`, and every derived variable: `scoreBreakdownData`, `totalScore`, `hasReviewData`, `latestReviewLabel`) are copied byte-for-byte from the current file — do not alter any of this logic, only the JSX markup/classes below it change.
- The circular score gauge changes from the old fake CSS-border trick (`border-8 ... rotate-45`, which was purely decorative and never actually reflected `totalScore` visually) to a real `conic-gradient` driven by `totalScore` — this is the same technique already used in `ResumeScoreCard` (Phase 1c) and `ScoreStepVisual` (Phase 1d), applied here for consistency AND because it's a genuine visual correctness improvement (the ring will now actually represent the score proportionally, which the old version never did).
- Layout structure: `Sidebar` on the left (renders nothing below `lg`), then a flex column containing `Navbar` (wrapped `lg:hidden`, so it only appears below `lg`) and `<main>`. `<main>`'s top padding changes from a flat `pt-24` to `pt-24 lg:pt-10` — mobile still needs `pt-24` to clear the fixed `Navbar`, but desktop (where `Navbar` is hidden and `Sidebar` isn't a fixed-overlay element) only needs a small `pt-10` breathing-room padding, not navbar-clearance padding.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): add Sidebar layout and restyle page content with tokens"
```

---

### Task 3: Restyle `StatCards`, `ProfileCompletion`, and `RecentDocuments`

**Files:**
- Modify: `src/components/dashboard/StatCards.tsx` (full replacement)
- Modify: `src/components/dashboard/ProfileCompletion.tsx` (full replacement)
- Modify: `src/components/dashboard/RecentDocuments.tsx` (full replacement)

**Interfaces:** none new — props/exports for all three stay identical to their current signatures.

- [ ] **Step 1: Replace `StatCards.tsx`**

Replace the full content of `src/components/dashboard/StatCards.tsx` with:

```tsx
"use client"
import { FileText, Mail, FileSearch, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

const iconVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.15
  }
}

export function StatCards({ stats }: { stats: { resumes: number, coverLetters: number, aiReviews: number, averageScore: number } }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" suppressHydrationWarning>
      {[
        { label: 'Resumes', count: stats.resumes.toString(), icon: FileText, href: '/resumes' },
        { label: 'Cover Letters', count: stats.coverLetters.toString(), icon: Mail, href: '/cover-letters' },
        { label: 'Reviews', count: stats.aiReviews.toString(), icon: FileSearch, href: '/ai-review' },
        { label: 'Avg Score', count: `${stats.averageScore}/100`, icon: TrendingUp, href: '/ai-review' }
      ].map((stat, i) => (
        <motion.div
          key={i}
          initial="initial"
          animate="animate"
          variants={cardVariants}
          transition={{ delay: i * 0.05 }}
        >
          <Link
            href={stat.href}
            className="block bg-(--surface) p-6 rounded-2xl border border-(--border) hover:border-(--accent)/60 transition-colors group flex items-center justify-between"
          >
            <div>
              <p className="text-(--muted) text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-(--foreground)">{stat.count}</p>
            </div>
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-(--accent-muted)"
              variants={iconVariants}
              whileHover="hover"
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <stat.icon className="w-6 h-6 text-(--accent)" />
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
```

Implementer note: the old version gave each of the 4 cards a different hardcoded icon color/background (`text-[#0A9548]`/`bg-[#0A9548]/10`, `bg-[#0A0F0D]`, `text-[#16DB65]`/`bg-[#0A9548]/12`) with no discernible pattern — this consolidates all 4 to the same `bg-(--accent-muted)` / `text-(--accent)` treatment, matching the consistent-icon-badge pattern already used everywhere else in this redesign (stat cards on the landing page, `ResumeFindingsCard`, etc.). This is a deliberate simplification, not a missed detail — the prop shape, motion variants, hrefs, and all data (`stats.resumes` etc.) are unchanged.

- [ ] **Step 2: Replace `ProfileCompletion.tsx`**

Replace the full content of `src/components/dashboard/ProfileCompletion.tsx` with:

```tsx
"use client"
import { X, CheckCircle2, Circle } from 'lucide-react'
import { useState } from 'react'

export function ProfileCompletion({ stats }: { stats?: { resumes: number, coverLetters: number, aiReviews: number } }) {
  const [isVisible, setIsVisible] = useState(true)
  if (!isVisible) return null

  const hasResume = (stats?.resumes ?? 0) > 0
  const hasCoverLetter = (stats?.coverLetters ?? 0) > 0
  const hasAiReview = (stats?.aiReviews ?? 0) > 0

  const completionCount = [hasResume, hasCoverLetter, hasAiReview].filter(Boolean).length
  const percent = (completionCount / 3) * 100

  return (
    <div className="bg-(--surface) p-6 rounded-2xl border border-(--border) relative mb-8" suppressHydrationWarning>
      <button onClick={() => setIsVisible(false)} className="absolute top-4 right-4 text-(--muted) hover:text-(--foreground)">
        <X className="w-5 h-5" />
      </button>
      <h3 className="text-xl font-bold text-(--foreground) mb-4">Profile Completion - {Math.round(percent)}%</h3>
      <div className="w-full bg-(--background) rounded-full h-2.5 mb-6 border border-(--border)">
        <div className="bg-(--accent) h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">{hasResume ? <CheckCircle2 className="w-5 h-5 text-(--accent)" /> : <Circle className="w-5 h-5 text-(--muted)" />}<span className="text-(--muted)">Create first resume</span></div>
        <div className="flex items-center gap-3">{hasCoverLetter ? <CheckCircle2 className="w-5 h-5 text-(--accent)" /> : <Circle className="w-5 h-5 text-(--muted)" />}<span className="text-(--muted)">Create cover letter</span></div>
        <div className="flex items-center gap-3">{hasAiReview ? <CheckCircle2 className="w-5 h-5 text-(--accent)" /> : <Circle className="w-5 h-5 text-(--muted)" />}<span className="text-(--muted)">Get AI review</span></div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace `RecentDocuments.tsx`**

Replace the full content of `src/components/dashboard/RecentDocuments.tsx` with:

```tsx
"use client"
import Link from 'next/link'
import { FileText, ArrowRight } from 'lucide-react'
import type { RecentDocument } from '@/lib/actions/db'

function getDocumentHref(doc: RecentDocument) {
  return doc.type === 'cover_letter' ? `/cover-letters/${doc.id}` : `/resumes/${doc.id}`
}

function getDocumentTypeLabel(doc: RecentDocument) {
  return doc.type === 'cover_letter' ? 'Cover Letter' : 'Resume'
}

export function RecentDocuments({ recentDocs }: { recentDocs: RecentDocument[] }) {
  return (
    <div className="mt-8" suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-(--foreground)">Recent Documents</h3>
        <Link href="/resumes" className="text-(--accent) hover:text-(--accent-strong) text-sm font-medium flex items-center gap-1">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {recentDocs.length > 0 ? recentDocs.map((doc) => (
          <Link href={getDocumentHref(doc)} key={doc.id} className="bg-(--surface) p-5 rounded-2xl border border-(--border) hover:border-(--accent)/60 transition-colors group cursor-pointer relative block" suppressHydrationWarning>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-(--accent-muted) rounded-lg flex items-center justify-center text-(--accent)">
                <FileText className="w-5 h-5" />
              </div>
              {typeof doc.score === 'number' && doc.score > 0 ? <span className="bg-(--accent-muted) text-(--accent) text-xs font-bold px-2 py-1 rounded">Score: {doc.score}</span> : null}
            </div>
            <h4 className="text-(--foreground) font-medium mb-1">{doc.title || 'Untitled Document'}</h4>
            <p className="text-xs text-(--muted)">
              {getDocumentTypeLabel(doc)}  -  Updated {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : 'N/A'}
            </p>
          </Link>
        )) : null}

        {/* Empty state / Create new prompt */}
        <div className="bg-(--surface) border-2 border-dashed border-(--border) rounded-2xl flex flex-col items-center justify-center p-6 text-center" suppressHydrationWarning>
            <p className="text-(--muted) text-sm mb-3">{recentDocs.length === 0 ? 'No resumes yet' : 'Create another tailored resume'}</p>
            <Link href="/resumes" className="bg-(--surface) hover:bg-(--surface-elevated) text-(--foreground) px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-(--border)">Create New</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify all three compile**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/StatCards.tsx src/components/dashboard/ProfileCompletion.tsx src/components/dashboard/RecentDocuments.tsx
git commit -m "feat(dashboard): restyle StatCards, ProfileCompletion, RecentDocuments with tokens"
```

---

### Task 4: Restyle `WeeklyGoals`, `QuickTip`, `RedeemCodeCard`, and `BenchmarkChart`

**Files:**
- Modify: `src/components/dashboard/WeeklyGoals.tsx` (full replacement)
- Modify: `src/components/dashboard/QuickTip.tsx` (full replacement)
- Modify: `src/components/dashboard/RedeemCodeCard.tsx` (full replacement)
- Modify: `src/components/dashboard/BenchmarkChart.tsx` (full replacement)

**Interfaces:** none new — props/exports for all four stay identical to their current signatures. `WeeklyGoals`' `localStorage` streak logic and `RedeemCodeCard`'s `fetch('/api/billing/redeem-code')` call are UNCHANGED — only JSX classes change.

- [ ] **Step 1: Replace `WeeklyGoals.tsx`**

Replace the full content of `src/components/dashboard/WeeklyGoals.tsx` with:

```tsx
"use client"
import { useEffect, useMemo } from 'react'
import { Flame, Target, CheckCircle2 } from 'lucide-react'

type Stats = { resumes: number; coverLetters: number; aiReviews: number }

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function computeStreak(isActiveToday: boolean): number {
  try {
    const raw = localStorage.getItem('joben_streak')
    const stored = raw ? (JSON.parse(raw) as { lastDay: string; count: number }) : null
    const today = todayKey()
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    if (!isActiveToday) return stored?.count ?? 0

    if (!stored) return 1
    if (stored.lastDay === today) return stored.count
    if (stored.lastDay === yesterday) return stored.count + 1
    return 1
  } catch {
    return isActiveToday ? 1 : 0
  }
}

function saveStreak(count: number) {
  try {
    localStorage.setItem('joben_streak', JSON.stringify({ lastDay: todayKey(), count }))
  } catch {}
}

export function WeeklyGoals({ stats }: { stats?: Stats }) {
  const rsCount = stats?.resumes ?? 0
  const clCount = stats?.coverLetters ?? 0
  const aiCount = stats?.aiReviews ?? 0

  const resumeGoalMet = rsCount >= 1
  const aiGoalMet = aiCount >= 1
  const clGoalMet = clCount >= 1
  const goalsCompleted = [resumeGoalMet, aiGoalMet, clGoalMet].filter(Boolean).length
  const isActiveToday = goalsCompleted > 0

  const streak = useMemo(() => computeStreak(isActiveToday), [isActiveToday])

  useEffect(() => {
    if (isActiveToday) saveStreak(streak)
  }, [isActiveToday, streak])

  const goals = [
    { label: 'Build a resume', current: rsCount, target: 1, done: resumeGoalMet },
    { label: 'Run an AI review', current: aiCount, target: 1, done: aiGoalMet },
    { label: 'Create a cover letter', current: clCount, target: 1, done: clGoalMet },
  ]

  return (
    <div className="bg-(--surface) p-6 rounded-2xl border border-(--border) flex flex-col" suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-(--foreground) flex items-center gap-2">
          <Target className="text-(--accent) w-5 h-5" /> Weekly Goals
        </h3>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
          streak > 0 ? 'bg-(--accent-muted) text-(--accent)' : 'bg-(--surface-elevated) text-(--muted)'
        }`}>
          <Flame className="w-4 h-4" />
          {streak} {streak === 1 ? 'day' : 'days'}
        </div>
      </div>

      <div className="space-y-4 grow">
        {goals.map((goal, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-sm ${goal.done ? 'text-(--accent)' : 'text-(--muted)'}`}>
                {goal.done && <CheckCircle2 className="w-4 h-4 inline mr-1.5" />}{goal.label}
              </span>
              <span className="text-(--muted) text-xs">
                {Math.min(goal.current, goal.target)}/{goal.target}
              </span>
            </div>
            <div className="w-full bg-(--surface-elevated) rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${goal.done ? 'bg-(--accent)' : 'bg-(--border)'}`}
                style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-(--border) text-center">
        <p className="text-sm text-(--muted) mb-1">
          {goalsCompleted}/3 goals complete this week
        </p>
        <p className="text-sm font-medium text-(--accent)">
          {goalsCompleted === 3
            ? 'All goals done! Keep it up!'
            : goalsCompleted > 0
            ? 'Keep going — you\'re on track!'
            : 'Start your streak today!'}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace `QuickTip.tsx`**

Replace the full content of `src/components/dashboard/QuickTip.tsx` with:

```tsx
"use client"
import { Lightbulb, RefreshCw, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

const tips = [
  "Use strong action verbs to start your bullet points. E.g., 'Spearheaded' instead of 'Responsible for'.",
  "Quantify your achievements with numbers, percentages, or dollar amounts to provide clear impact.",
  "Keep your resume to one page unless you have more than 10 years of highly relevant experience."
]

export function QuickTip() {
  const [idx, setIdx] = useState(0)

  return (
    <div className="bg-(--surface) p-6 rounded-2xl border border-(--border) flex flex-col justify-between" suppressHydrationWarning>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-(--foreground) flex items-center gap-2">
            <Lightbulb className="text-(--accent) w-5 h-5" /> Quick Tip
          </h3>
          <button onClick={() => setIdx((idx + 1) % tips.length)} className="text-(--muted) hover:text-(--foreground) p-1">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-(--muted) text-sm leading-relaxed mb-6">{tips[idx]}</p>
      </div>
      <Link href="/resumes" className="text-(--accent) hover:text-(--accent-strong) text-sm font-medium flex items-center gap-1">
        Edit resume <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Replace `RedeemCodeCard.tsx`**

Replace the full content of `src/components/dashboard/RedeemCodeCard.tsx` with:

```tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Gift, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { UserPlan } from '@/lib/plans'
import { buttonVariants } from '@/components/ui/Button'

type RedeemCodeCardProps = {
  currentPlan: UserPlan
}

export function RedeemCodeCard({ currentPlan }: RedeemCodeCardProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const alreadyRecruiting = currentPlan === 'recruiting'

  async function handleRedeem() {
    if (alreadyRecruiting) {
      setErrorMessage(null)
      setSuccessMessage('Recruiting lifetime plan is already active on your account.')
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    const trimmedCode = code.trim()
    if (!trimmedCode) {
      setErrorMessage('Enter a valid code.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/billing/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: trimmedCode }),
      })

      const payload = (await response.json()) as {
        success?: boolean
        message?: string
        error?: string
      }

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error || 'Could not redeem code right now.')
        return
      }

      setSuccessMessage(payload.message || 'Recruiting lifetime plan is now active.')
      setCode('')
      router.refresh()
    } catch (error) {
      setErrorMessage((error as Error).message || 'Could not redeem code right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="bg-(--surface) p-6 rounded-2xl border border-(--border) mb-8"
      suppressHydrationWarning
    >
      <div className="flex items-start justify-between gap-4 mb-4" suppressHydrationWarning>
        <div>
          <h3 className="text-lg font-bold text-(--foreground) flex items-center gap-2">
            <Gift className="w-5 h-5 text-(--accent)" /> Redeem Access Code
          </h3>
          <p className="text-sm text-(--muted) mt-1">
            Activate special access instantly. Code is case-insensitive.
          </p>
        </div>
        {alreadyRecruiting ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-(--accent)/40 bg-(--accent-muted) px-3 py-1 text-xs font-semibold text-(--accent)">
            <CheckCircle2 className="w-3.5 h-3.5" /> Recruiting Active
          </span>
        ) : null}
      </div>

      <div className="flex flex-col sm:flex-row gap-3" suppressHydrationWarning>
        <motion.input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter private access code"
          disabled={isSubmitting || alreadyRecruiting}
          className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent) focus:outline-none disabled:opacity-60"
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
        <motion.button
          type="button"
          onClick={() => void handleRedeem()}
          disabled={isSubmitting || alreadyRecruiting}
          className={`min-w-36 disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {alreadyRecruiting ? 'Already Active' : isSubmitting ? 'Applying...' : 'Redeem Code'}
        </motion.button>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
      ) : null}

      {successMessage ? (
        <p className="mt-3 text-sm text-(--accent)">{successMessage}</p>
      ) : null}
    </motion.div>
  )
}
```

Implementer note: this fixes a genuine pre-existing bug while restyling — the old version rendered `errorMessage` in `text-[#16DB65]` (the brand green/success color), so error text was colored the SAME as success text, making it confusing to tell an error from a success message. This version uses `text-red-400` for `errorMessage` (matching the semantic-red pattern used for errors everywhere else in this redesign, e.g. `formFieldErrorText` in Phase 2's `clerkAppearance`) and keeps `text-(--accent)` only for `successMessage`. This is a real bug fix bundled with the restyle, not scope creep — the class name literally said "error" but used the success color.

- [ ] **Step 4: Replace `BenchmarkChart.tsx`**

Replace the full content of `src/components/dashboard/BenchmarkChart.tsx` with:

```tsx
"use client"
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts'

function bellCurveValue(x: number, mean: number, std: number): number {
  return Math.exp(-0.5 * ((x - mean) / std) ** 2)
}

function buildDistribution() {
  const mean = 62
  const std = 16
  const points = []
  for (let score = 0; score <= 100; score += 2) {
    points.push({
      score,
      frequency: Math.round(bellCurveValue(score, mean, std) * 1000) / 10,
    })
  }
  return points
}

const data = buildDistribution()

type Props = {
  userScore: number
}

export function BenchmarkChart({ userScore }: Props) {
  const percentile = Math.round(
    (data.filter((d) => d.score <= userScore).length / data.length) * 100
  )

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -32 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2CB87A" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#2CB87A" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="score"
            tick={{ fill: '#8A8A92', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => (v % 20 === 0 ? String(v) : '')}
          />
          <YAxis hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as { score: number; frequency: number }
              return (
                <div className="bg-(--surface-elevated) border border-(--border) rounded-lg px-3 py-1.5 text-xs text-(--muted)">
                  Score {d.score}: {d.frequency}% of resumes
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="frequency"
            stroke="#2CB87A"
            strokeWidth={2}
            fill="url(#scoreGrad)"
            dot={false}
            activeDot={false}
          />
          <ReferenceLine
            x={userScore}
            stroke="#4FD69B"
            strokeWidth={2}
            strokeDasharray="4 2"
            label={{
              value: `You: ${userScore}`,
              position: userScore > 70 ? 'insideTopLeft' : 'insideTopRight',
              fill: '#4FD69B',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-(--muted) mt-3">
        Your score of <span className="text-(--foreground) font-medium">{userScore}</span> is higher than approximately{' '}
        <span className="text-(--accent) font-medium">{percentile}%</span> of resumes in our system.
      </p>
    </div>
  )
}
```

Implementer note: `recharts` props like `stroke`/`fill`/`tick.fill` take literal SVG color values, not CSS classes — these CANNOT use the `text-(--accent)` Tailwind arbitrary-value syntax (that only works on `className`, not raw SVG attributes), so they use the literal Phase 0 hex values (`#2CB87A` accent, `#4FD69B` accent-strong, `#8A8A92` muted) directly, matching the same "duplicate the literal hex for non-Tailwind-reachable surfaces" pattern already used for the resume mockup and Clerk `variables` elsewhere in this redesign. Only the `Tooltip`'s custom `content` renderer (which returns real JSX with a real `className`) uses token classes.

- [ ] **Step 5: Verify all four compile**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

Run: `npm run lint`
Expected: 0 errors (same 4 pre-existing unrelated warnings in `src/app/api/*` are fine).

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/WeeklyGoals.tsx src/components/dashboard/QuickTip.tsx src/components/dashboard/RedeemCodeCard.tsx src/components/dashboard/BenchmarkChart.tsx
git commit -m "feat(dashboard): restyle WeeklyGoals, QuickTip, RedeemCodeCard, BenchmarkChart with tokens; fix error-message color bug"
```

---

### Task 5: Functional and visual verification with real seeded data

**Files:** none (verification only)

This task requires a REAL authenticated session with REAL Supabase-backed data — not a static screenshot. A live Clerk session and seeded local Supabase rows already exist from earlier in this work session (local Supabase running via `npx supabase start`, one signed-up test user, 2 seeded resumes, 1 cover letter, 2 AI reviews). Reuse that session/data; do not re-seed unless the controller indicates the session was lost.

- [ ] **Step 1: Screenshot the restyled dashboard**

Navigate to `http://localhost:3000/dashboard` in the already-authenticated browser session. Take a full-page screenshot at desktop width (1440px+, wide enough to show the sidebar).

- [ ] **Step 2: Verify the data is REAL, not hardcoded**

Cross-check every number on the page against the actual seeded data:
- `StatCards`: Resumes = 2, Cover Letters = 1, Reviews = 2, Avg Score = 76 (average of the two seeded `ai_reviews.score` values, 87 and 65)
- `ProfileCompletion`: 100%, all three checklist items checked (since resumes/coverLetters/aiReviews are all > 0)
- Score Breakdown: reflects the LATEST review's category breakdown (the more recently created one)
- Circular score gauge: shows the latest review's total score, and the conic-gradient ring's fill proportion visibly matches that score
- `RecentDocuments`: shows the 2 seeded resumes and 1 seeded cover letter by their actual titles, sorted by most-recently-updated first
- If any of these numbers look hardcoded/wrong, that's a real regression — do not just note it, treat it as a blocking finding.

- [ ] **Step 3: Verify sidebar navigation actually works**

Click each of the 4 main sidebar nav links (Dashboard, Resumes, Cover Letters, AI Review) and the Settings link at the bottom. Confirm each one navigates to the correct URL (even if those destination pages haven't been restyled yet and still show their old Navbar-based look — that's expected and fine, this phase doesn't touch those pages). Confirm the active-route highlight updates correctly when you're back on `/dashboard`.

- [ ] **Step 4: Verify responsive fallback**

Resize the viewport below the `lg` breakpoint (e.g. 768px). Confirm the `Sidebar` disappears and the original `Navbar` appears in its place, with no broken layout or missing navigation.

- [ ] **Step 5: Compare against the resumax.ai reference**

The reference screenshot from the original design-research session (session scratchpad — the dashboard-home capture: sidebar with logo/search/nav items/resources/settings, main content with a step-checklist pattern) is a STRUCTURAL reference only — Joben's dashboard content is intentionally different (real stats/benchmark/goals widgets, not a job-search step-checklist), per this phase's scope-boundary decision. Compare the sidebar's visual language (spacing, active-state highlight, icon+label pattern) against the resumax reference, not the main content area.

- [ ] **Step 6: Report to user**

Show the screenshot(s), the real-data cross-check results, and the nav-link verification results. Run the full verification suite (`npx tsc --noEmit`, `npm run lint`, `npm test`) one more time before declaring the phase done.
