# ResuMax-Style Redesign — Phase 1d: 5-Step Product Loop Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new landing-page section between the resume-score showcase and pricing: 5 steps (Score → Tailor → Rewrite → Cover Letter → Export & Manage), each with a step counter/category eyebrow, heading, description, bullet list on the left, and a small illustrative visual card on the right that stays in view (CSS `position: sticky`) while its step's text is in the viewport — approximating resumax's scroll-driven step section without custom scroll-jacking JS.

**Architecture:** One generic layout component (`StepSection`) renders any step's text block + a `sticky` visual slot, consumed 5 times. Five small, single-purpose visual components (one per step) provide the `visual` content — each reuses `Card`/token patterns already established in this redesign, at a similar fidelity level to the `ResumeScoreCard`/`ResumeFindingsCard` built in Phase 1c (flat cards, a few rows of illustrative mock data, no bespoke illustration work). Step copy (heading/description/bullets) lives in `src/lib/content.ts` as a new `productLoopSteps` array, grounded in Joben's real, already-priced features (resume tailoring, bullet rewrites, AI cover letters, exports/saved CVs — see `pricingPlans` in the same file for the source of truth on what Joben actually offers).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind v4, Phase 0/1 tokens and primitives (`Card`, `Eyebrow` from `src/components/ui/`). No new npm dependencies — sticky positioning is pure CSS, no scroll-linked JS needed.

## Global Constraints

- Content is 100% Joben, grounded in real features — no job-board/application-tracking/interview-prep/negotiation content (Joben doesn't have those features; do not imply otherwise). Every step's copy must map to something in `pricingPlans`' feature lists (already true of the copy given in this plan — implementers should not invent new claims).
- No new npm dependencies.
- Use Phase 0/1 CSS custom properties via Tailwind arbitrary-value syntax instead of hardcoded hex.
- This section goes between the resume-score showcase (`</section>` closing `id="analysis"`) and `{/* PRICING */}` in `src/app/page.tsx` — do not touch either of those sections' internals.
- Sticky visuals only need `lg:sticky` (desktop) — below `lg`, the visual should sit in normal flow directly under its step's text (no sticky behavior needed on narrow viewports, consistent with how Phase 1c's floating cards also only activate at `lg:`).
- After every task: `npx tsc --noEmit` must pass with no new errors.

---

### Task 1: Add `productLoopSteps` content data

**Files:**
- Modify: `src/lib/content.ts` (add a new export; do not change any existing export)

**Interfaces:**
- Produces: `export const productLoopSteps: { number: string; category: string; heading: string; description: string; bullets: string[] }[]` — exactly 5 entries. Consumed by Task 4 (wiring into `page.tsx`) and indirectly informs Tasks 3's visual components (which take their own separate, hardcoded illustrative data — see Task 3 — not `productLoopSteps`, since the visuals show different mock data like sample job descriptions/bullets, not the step copy itself).

- [ ] **Step 1: Add the export**

Add this new export to `src/lib/content.ts` (anywhere after the existing `atsPreviewContent` export, before `pricingPlans` — do not modify `pricingPlans`, `faqItems`, or any other existing export):

```ts
export const productLoopSteps = [
  {
    number: "01",
    category: "Score",
    heading: "See your score before you apply.",
    description: "Upload your resume and get a 0-100 ATS score across five categories, with the exact strengths and gaps recruiters and parsers will see.",
    bullets: [
      "Every resume scored 0-100 across 5 categories",
      "See exactly what recruiters and ATS parsers see",
      "Know what to fix before you apply, not after",
    ],
  },
  {
    number: "02",
    category: "Tailor",
    heading: "Tailor your resume to the job description.",
    description: "Paste a job description and Joben finds the missing keywords, then rewrites your bullets to fit that specific role.",
    bullets: [
      "Paste any job description, get instant keyword analysis",
      "Bullets rewritten to match the role, not generic AI filler",
      "One click, one tailored variant, one new draft",
    ],
  },
  {
    number: "03",
    category: "Rewrite",
    heading: "Turn weak bullets into quantified wins.",
    description: "One-click AI rewrite for any bullet: adds metrics, strong verbs, and keeps your voice.",
    bullets: [
      "Weak verbs become strong, measurable outcomes",
      "Keeps your voice — never reads like generic AI",
      "Every rewrite tracked live against your monthly limit",
    ],
  },
  {
    number: "04",
    category: "Cover Letter",
    heading: "A cover letter that matches your resume and the job.",
    description: "AI-generated, consistent tone with your resume, tailored to the same job description.",
    bullets: [
      "Matches the tone and facts of your tailored resume",
      "Written for the same job description, not a template",
      "Ready to send in the time it takes to read this",
    ],
  },
  {
    number: "05",
    category: "Export & Manage",
    heading: "Export clean, keep every version organized.",
    description: "Download ATS-ready PDF or DOCX, and keep multiple tailored resumes managed from one dashboard.",
    bullets: [
      "Clean, unwatermarked PDF and DOCX exports",
      "Keep multiple tailored versions per role",
      "Manage everything from one dashboard",
    ],
  },
]
```

- [ ] **Step 2: Verify**

Run: `grep -c '"number":' src/lib/content.ts`
Expected: `5`

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/lib/content.ts
git commit -m "feat(content): add productLoopSteps copy for the 5-step landing section"
```

---

### Task 2: Create the `StepSection` layout component

**Files:**
- Create: `src/components/landing/StepSection.tsx`

**Interfaces:**
- Produces: `export function StepSection({ number, totalSteps, category, heading, description, bullets, visual }: StepSectionProps)`. `StepSectionProps = { number: string; totalSteps: number; category: string; heading: string; description: string; bullets: string[]; visual: React.ReactNode }`. Task 4 renders this 5 times, once per entry in `productLoopSteps`, passing that step's own visual component (Task 3) as `visual`.

- [ ] **Step 1: Write the component**

Create `src/components/landing/StepSection.tsx`:

```tsx
import * as React from 'react'

export interface StepSectionProps {
  number: string
  totalSteps: number
  category: string
  heading: string
  description: string
  bullets: string[]
  visual: React.ReactNode
}

export function StepSection({ number, totalSteps, category, heading, description, bullets, visual }: StepSectionProps) {
  return (
    <div className="grid gap-8 py-16 border-t border-(--border) first:border-t-0 lg:grid-cols-2 lg:items-start lg:gap-16">
      <div>
        <div className="flex items-center gap-4 mb-6">
          <span className="font-mono text-xs text-(--muted)">{number} / {String(totalSteps).padStart(2, '0')}</span>
          <span className="h-px flex-1 bg-(--border)" />
          <span className="font-mono text-xs uppercase tracking-wide text-(--accent)">{category}</span>
        </div>
        <h3 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">{heading}</h3>
        <p className="text-(--muted) mb-6">{description}</p>
        <ul className="space-y-2">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm text-(--muted)">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-(--accent) shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:sticky lg:top-32">{visual}</div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/StepSection.tsx
git commit -m "feat(landing): add StepSection layout with sticky visual slot"
```

---

### Task 3: Create the 5 step visual components

**Files:**
- Create: `src/components/landing/steps/ScoreStepVisual.tsx`
- Create: `src/components/landing/steps/TailorStepVisual.tsx`
- Create: `src/components/landing/steps/RewriteStepVisual.tsx`
- Create: `src/components/landing/steps/CoverLetterStepVisual.tsx`
- Create: `src/components/landing/steps/ExportStepVisual.tsx`

**Interfaces:**
- Each: `export function XStepVisual()` — no props, purely illustrative mock content specific to that step (hardcoded example data, same status as the "John Doe" resume mockup and `atsPreviewContent`'s example numbers elsewhere in this codebase — illustrative UI texture, not real user data or a factual claim). Consumed once each by Task 4.

- [ ] **Step 1: Create `ScoreStepVisual.tsx`**

Create `src/components/landing/steps/ScoreStepVisual.tsx`:

```tsx
import { Card } from '@/components/ui/Card'

const MINI_CATEGORIES = [
  { label: 'ATS readability', value: 92 },
  { label: 'Content quality', value: 88 },
  { label: 'Writing quality', value: 95 },
]

export function ScoreStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm">
      <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-4">resume.pdf · scored</p>
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-5xl font-black text-(--foreground)">93</span>
        <span className="text-sm text-(--muted)">/ 100 · Excellent</span>
      </div>
      <div className="space-y-3">
        {MINI_CATEGORIES.map((category) => (
          <div key={category.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-(--foreground)">{category.label}</span>
              <span className="text-(--muted) font-mono">{category.value}%</span>
            </div>
            <div className="h-1 rounded-full bg-(--border) overflow-hidden">
              <div className="h-full rounded-full bg-(--accent)" style={{ width: `${category.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Create `TailorStepVisual.tsx`**

Create `src/components/landing/steps/TailorStepVisual.tsx`:

```tsx
import { Card } from '@/components/ui/Card'

export function TailorStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm space-y-5">
      <div>
        <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-2">Job description · Stripe</p>
        <p className="text-sm text-(--foreground) leading-relaxed">
          You will own <span className="rounded bg-(--accent-muted) px-1 text-(--accent)">payment-rail integrations</span> for a high-volume,{' '}
          <span className="rounded bg-(--accent-muted) px-1 text-(--accent)">distributed systems</span> platform.
        </p>
      </div>
      <div className="border-t border-(--border) pt-4">
        <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-2">Bullet rewritten for this role</p>
        <p className="text-sm text-(--muted) line-through decoration-(--muted) mb-1">Built a payments service with retries and a queue.</p>
        <p className="text-sm text-(--foreground)">
          Designed a <span className="text-(--accent) font-medium">payment-rail</span> service with retry semantics across a{' '}
          <span className="text-(--accent) font-medium">distributed</span> queue.
        </p>
      </div>
    </Card>
  )
}
```

- [ ] **Step 3: Create `RewriteStepVisual.tsx`**

Create `src/components/landing/steps/RewriteStepVisual.tsx`:

```tsx
import { Card } from '@/components/ui/Card'

export function RewriteStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm">
      <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-4">Bullet rewrite</p>
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-wide text-(--muted) mb-1">Before</p>
        <p className="text-sm text-(--muted) line-through decoration-(--muted)">Helped team increase sales.</p>
      </div>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wide text-(--accent) mb-1">After</p>
        <p className="text-sm text-(--foreground)">
          Spearheaded initiative driving a <span className="text-(--accent) font-medium">23% sales increase</span> in Q3.
        </p>
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Create `CoverLetterStepVisual.tsx`**

Create `src/components/landing/steps/CoverLetterStepVisual.tsx`:

```tsx
import { Card } from '@/components/ui/Card'

export function CoverLetterStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm">
      <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-4">Cover letter · Stripe</p>
      <div className="rounded-lg bg-white p-4 text-[#1F2937] text-xs leading-relaxed space-y-2">
        <p>Dear Hiring Manager,</p>
        <p>
          Having <span className="rounded bg-(--accent-muted) px-1 text-(--accent)">reduced checkout failures by 40%</span> in my
          current role, I&apos;m excited about the Senior Software Engineer position on your payments team.
        </p>
        <p>Sincerely, John Doe</p>
      </div>
    </Card>
  )
}
```

- [ ] **Step 5: Create `ExportStepVisual.tsx`**

Create `src/components/landing/steps/ExportStepVisual.tsx`:

```tsx
import { Card } from '@/components/ui/Card'
import { Download } from 'lucide-react'

const DOCUMENTS = [
  { name: 'Resume — Stripe (v3)', format: 'PDF ready' },
  { name: 'Resume — Vercel (v2)', format: 'PDF ready' },
  { name: 'Cover Letter — Stripe', format: 'DOCX ready' },
]

export function ExportStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm">
      <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-4">Your documents</p>
      <div className="space-y-3">
        {DOCUMENTS.map((doc) => (
          <div key={doc.name} className="flex items-center justify-between gap-3 rounded-lg border border-(--border) px-3 py-2.5">
            <div>
              <p className="text-sm text-(--foreground)">{doc.name}</p>
              <p className="text-xs text-(--muted)">{doc.format}</p>
            </div>
            <Download className="w-4 h-4 text-(--accent) shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  )
}
```

- [ ] **Step 6: Verify all 5 compile**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

Run: `grep -l "export function" src/components/landing/steps/*.tsx | wc -l`
Expected: `5`

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/steps/
git commit -m "feat(landing): add 5 step visual components for the product loop section"
```

---

### Task 4: Wire the 5-step section into `page.tsx`

**Files:**
- Modify: `src/app/page.tsx` (add imports + a new section; do not touch the resume-score-showcase section above or the pricing section below)

**Interfaces:**
- Consumes: `StepSection` (Task 2), the 5 visual components (Task 3), `productLoopSteps` (Task 1).

- [ ] **Step 1: Add imports**

Add to the top of `src/app/page.tsx`, alongside the existing imports:

```tsx
import { productLoopSteps } from '@/lib/content'
import { StepSection } from '@/components/landing/StepSection'
import { ScoreStepVisual } from '@/components/landing/steps/ScoreStepVisual'
import { TailorStepVisual } from '@/components/landing/steps/TailorStepVisual'
import { RewriteStepVisual } from '@/components/landing/steps/RewriteStepVisual'
import { CoverLetterStepVisual } from '@/components/landing/steps/CoverLetterStepVisual'
import { ExportStepVisual } from '@/components/landing/steps/ExportStepVisual'
```

(`productLoopSteps` joins the existing named import from `@/lib/content` — add it to that existing import statement rather than creating a second one, e.g. `import { heroContent, statCards, atsPreviewContent, pricingPlans, faqItems, footerContent, productLoopSteps } from '@/lib/content'`.)

- [ ] **Step 2: Insert the new section**

Find the closing `</section>` of the resume-score-showcase section (`id="analysis"`) and the `{/* PRICING */}` comment right after it. Insert a new section between them:

```tsx
        {/* PRODUCT LOOP */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto" suppressHydrationWarning>
          {productLoopSteps.map((step, index) => {
            const visuals = [
              <ScoreStepVisual key="score" />,
              <TailorStepVisual key="tailor" />,
              <RewriteStepVisual key="rewrite" />,
              <CoverLetterStepVisual key="cover-letter" />,
              <ExportStepVisual key="export" />,
            ]
            return (
              <StepSection
                key={step.number}
                number={step.number}
                totalSteps={productLoopSteps.length}
                category={step.category}
                heading={step.heading}
                description={step.description}
                bullets={step.bullets}
                visual={visuals[index]}
              />
            )
          })}
        </section>
```

- [ ] **Step 3: Verify the full file compiles clean**

Run: `npx tsc --noEmit`
Expected: clean, no output.

Run: `npm run lint`
Expected: 0 errors (same 4 pre-existing unrelated warnings in `src/app/api/*` are fine).

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(design): add 5-step product loop section to landing page"
```

---

### Task 5: Visual verification against the resumax.ai reference

**Files:** none (verification only)

- [ ] **Step 1: Screenshot the new section**

The dev server should already be running at `http://localhost:3000` (confirm with a quick health check; start it if it's down — `.env.local` should already be in place from earlier in this session). Use Playwright to navigate there, scroll to the new section (right after the resume-score showcase, before pricing), and take screenshots at a desktop viewport (1440px) showing at least 2-3 of the 5 steps as you scroll through — confirm each step's visual card stays in view (sticky) while its own text is in the viewport, and that the NEXT step's visual replaces it once you've scrolled past.

- [ ] **Step 2: Compare against the resumax.ai reference**

The reference screenshots from the original design-research session (session scratchpad — the "01/05 DISCOVER", "02/05 TAILOR", "03/05 TRACK" step screenshots) showed: eyebrow step counter + category label with a connecting line, large bold heading, paragraph, bulleted list with accent-colored dot markers, and a demo visual card on the right. Report to the user:
- Does the step counter/category eyebrow row render correctly ("01 / 05 ────── SCORE" style)?
- Does the visual card actually stick in place while scrolling through its step's text, and hand off cleanly to the next step's visual?
- Do all 5 steps' visual cards render their illustrative content correctly (no broken layout, no missing icons)?
- Does the section collapse gracefully below `lg` (spot-check at 768px — text and visual should stack normally, no broken sticky behavior)?

- [ ] **Step 3: Report to user**

Show screenshots and comparison notes. Do not proceed to the next landing-page sub-section (pricing) until the user confirms this one.
