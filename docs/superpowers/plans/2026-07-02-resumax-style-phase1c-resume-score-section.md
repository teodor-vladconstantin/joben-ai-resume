# ResuMax-Style Redesign — Phase 1c: Resume Score Showcase Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the landing page's "See What Recruiters See In Your Resume" section (`<section id="analysis">` in `src/app/page.tsx`) to match resumax.ai's floating-card-over-mockup layout: a circular score gauge + category breakdown card floating on one side of the resume mockup, and a "what we found" strengths/improvements card floating on the other side — replacing the current two-column (mockup left, text right) layout.

**Architecture:** Two new small presentational components under `src/components/landing/` (`ResumeScoreCard` for the circular gauge + category breakdown, `ResumeFindingsCard` for the strengths/improvements panel), both consumed by `src/app/page.tsx` and absolutely-positioned to overlap the existing resume mockup markup (which is kept as-is — only its wrapping/positioning context changes, not its internal content). `src/lib/content.ts`'s `atsPreviewContent` gains a `categories` array (5 scored categories summing to the existing `score: 93`) and a `findings` object (strengths/improvements headline+description pairs) — the existing `strengths`/`improvement` (before/after) fields stay in the data model unused by this section (they'll be consumed later by the "03 · Rewrite" step of the 5-step product loop, a separate future task — do not delete them).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind v4, Phase 0 tokens/primitives (`Card`, `Badge`/`Eyebrow` from `src/components/ui/`).

## Global Constraints

- Content is 100% Joben — the category breakdown and findings copy are illustrative example data (same status as the existing `atsPreviewContent.score: 93` and the "John Doe" mockup resume, which are already illustrative, not real user data), not resumax copy.
- No new npm dependencies.
- Use Phase 0 CSS custom properties via Tailwind arbitrary-value syntax instead of hardcoded hex.
- Do not touch the hero section, the stat-cards grid immediately above this section, or anything from `{/* PRICING */}` onward in `page.tsx`.
- The floating-card overlap layout only needs to work at `lg:` and above (matching resumax's own desktop-oriented floating layout) — on smaller viewports, stack the mockup and both cards vertically in normal document flow rather than attempting the overlap (avoids broken/clipped absolute positioning on narrow screens).
- After every task: `npx tsc --noEmit` must pass with no new errors.

---

### Task 1: Extend `atsPreviewContent` with category breakdown and findings copy

**Files:**
- Modify: `src/lib/content.ts` (the `atsPreviewContent` export)

**Interfaces:**
- Produces: `atsPreviewContent.categories: { label: string; value: number; max: number }[]` (5 entries, `value` sums to `score`), `atsPreviewContent.scoreLabel: string`, `atsPreviewContent.findings: { strengths: { title: string; description: string }; improvements: { title: string; description: string } }`. Existing `heading`, `subheading`, `score`, `strengths` (array), and `improvement` (before/after) fields are UNCHANGED — do not remove or rename them, later work depends on them.

- [ ] **Step 1: Add the new fields**

In `src/lib/content.ts`, find the `atsPreviewContent` export (currently):

```ts
export const atsPreviewContent = {
  heading: "See What Recruiters See In Your Resume",
  subheading: "Our AI analyzes your resume against millions of job postings to give you an exact match score.",
  score: 93,
  strengths: [
    "Strong action verbs used throughout.",
    "Perfectly structured for ATS parsers.",
  ],
  improvement: {
    before: "Helped team increase sales",
    after: "Spearheaded initiative driving a sales increase in Q3.",
  },
};
```

Replace it with:

```ts
export const atsPreviewContent = {
  heading: "See What Recruiters See In Your Resume",
  subheading: "Our AI analyzes your resume against millions of job postings to give you an exact match score.",
  score: 93,
  scoreLabel: "Excellent",
  categories: [
    { label: "ATS readability", value: 23, max: 25 },
    { label: "Content quality", value: 32, max: 35 },
    { label: "Writing quality", value: 9, max: 10 },
    { label: "Job optimization", value: 24, max: 25 },
    { label: "Application ready", value: 5, max: 5 },
  ],
  findings: {
    strengths: {
      title: "Strengths identified",
      description: "Strong action verbs and quantified bullet points throughout your experience section.",
    },
    improvements: {
      title: "Improvement suggestions",
      description: "Add a technical skills summary near the top and tighten your most recent role's bullets.",
    },
  },
  strengths: [
    "Strong action verbs used throughout.",
    "Perfectly structured for ATS parsers.",
  ],
  improvement: {
    before: "Helped team increase sales",
    after: "Spearheaded initiative driving a sales increase in Q3.",
  },
};
```

Note for the implementer: yes, both the old `strengths`/`improvement` fields AND the new `findings` object exist side by side — this is intentional, not a duplication bug. `findings` is what this task's new UI consumes; `strengths`/`improvement` stay in place for a later, separate task (the 5-step product loop's "Rewrite" step) that hasn't been built yet.

- [ ] **Step 2: Verify the category values sum to `score`**

Run: `node -e "console.log(23+32+9+24+5)"`
Expected: `93` (matches `score: 93` — if you changed any category value, re-check this still sums correctly, or update `score` to match).

- [ ] **Step 3: Verify no other file breaks**

Run: `grep -rn "atsPreviewContent" src --include="*.tsx" --include="*.ts"`
Expected: `src/lib/content.ts` (definition) and `src/app/page.tsx` (the only consumer — it doesn't reference `.categories`/`.findings`/`.scoreLabel` yet, so it's unaffected by this additive change; it still compiles against the fields it already used).

Run: `npx tsc --noEmit`
Expected: no output (exit code 0) — this is a purely additive change to an object literal, nothing should break.

- [ ] **Step 4: Commit**

```bash
git add src/lib/content.ts
git commit -m "feat(content): add category breakdown and findings copy to atsPreviewContent"
```

---

### Task 2: Create the `ResumeScoreCard` component

**Files:**
- Create: `src/components/landing/ResumeScoreCard.tsx`

**Interfaces:**
- Consumes: `Card` from `src/components/ui/Card.tsx`, `--accent`/`--background`/`--border`/`--foreground`/`--muted` CSS variables.
- Produces: `export function ResumeScoreCard({ score, scoreLabel, categories }: ResumeScoreCardProps)`. `ResumeScoreCardProps = { score: number; scoreLabel: string; categories: { label: string; value: number; max: number }[] }`. Renders a circular score gauge (conic-gradient ring, matching the visual technique already used elsewhere in this same file for the small badge — see below) plus a list of category rows, each with a thin progress bar and an "X/Y" label.

- [ ] **Step 1: Write the component**

Create `src/components/landing/ResumeScoreCard.tsx`:

```tsx
import { Card } from '@/components/ui/Card'

export interface ResumeScoreCardProps {
  score: number
  scoreLabel: string
  categories: { label: string; value: number; max: number }[]
}

export function ResumeScoreCard({ score, scoreLabel, categories }: ResumeScoreCardProps) {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-xs">
      <div className="flex flex-col items-center text-center mb-6">
        <div
          className="relative grid h-24 w-24 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--accent) ${score}%, color-mix(in srgb, var(--foreground) 10%, transparent) ${score}% 100%)`,
          }}
        >
          <div className="absolute inset-2 rounded-full bg-(--surface-elevated)" />
          <div className="relative text-center">
            <p className="text-2xl leading-none font-black text-(--foreground)">{score}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-(--accent)">/ 100</p>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-(--accent)">{scoreLabel}</p>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-mono uppercase tracking-wide text-(--muted)">Category breakdown</p>
        {categories.map((category) => (
          <div key={category.label}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-(--foreground)">{category.label}</span>
              <span className="text-(--muted) font-mono text-xs">{category.value}/{category.max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-(--border) overflow-hidden">
              <div
                className="h-full rounded-full bg-(--accent)"
                style={{ width: `${(category.value / category.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

Note for the implementer: the conic-gradient circular gauge technique here mirrors the one already present in `src/app/page.tsx`'s current ATS-preview markup (a small badge with `background: conic-gradient(...)`) — this component is a bigger, standalone version of that same idea, not a new visual language.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/ResumeScoreCard.tsx
git commit -m "feat(landing): add ResumeScoreCard gauge + category breakdown component"
```

---

### Task 3: Create the `ResumeFindingsCard` component

**Files:**
- Create: `src/components/landing/ResumeFindingsCard.tsx`

**Interfaces:**
- Consumes: `Card` and `Eyebrow` from `src/components/ui/Card.tsx` / `src/components/ui/Badge.tsx`.
- Produces: `export function ResumeFindingsCard({ strengths, improvements }: ResumeFindingsCardProps)`. `ResumeFindingsCardProps = { strengths: { title: string; description: string }; improvements: { title: string; description: string } }`.

- [ ] **Step 1: Write the component**

Create `src/components/landing/ResumeFindingsCard.tsx`:

```tsx
import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Badge'

export interface ResumeFindingsCardProps {
  strengths: { title: string; description: string }
  improvements: { title: string; description: string }
}

export function ResumeFindingsCard({ strengths, improvements }: ResumeFindingsCardProps) {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-xs space-y-6">
      <Eyebrow>What we found</Eyebrow>

      <div>
        <h3 className="text-(--foreground) font-bold mb-1.5">{strengths.title}</h3>
        <p className="text-sm text-(--muted)">{strengths.description}</p>
      </div>

      <div>
        <h3 className="text-(--foreground) font-bold mb-1.5">{improvements.title}</h3>
        <p className="text-sm text-(--muted)">{improvements.description}</p>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/ResumeFindingsCard.tsx
git commit -m "feat(landing): add ResumeFindingsCard strengths/improvements component"
```

---

### Task 4: Wire both cards into the resume-score section with floating overlap layout

**Files:**
- Modify: `src/app/page.tsx` (the `<section id="analysis">` block only, currently lines 113-224 as of the start of this plan — re-locate by the `{/* ATS PREVIEW SECTION */}` comment, since earlier tasks in this session may have shifted exact line numbers slightly)

**Interfaces:**
- Consumes: `ResumeScoreCard` (Task 2), `ResumeFindingsCard` (Task 3), `atsPreviewContent.categories`/`.scoreLabel`/`.findings` (Task 1).

- [ ] **Step 1: Add imports**

Add to the top of `src/app/page.tsx`, alongside the existing component imports:

```tsx
import { ResumeScoreCard } from '@/components/landing/ResumeScoreCard'
import { ResumeFindingsCard } from '@/components/landing/ResumeFindingsCard'
```

- [ ] **Step 2: Replace the whole section**

Find the `{/* ATS PREVIEW SECTION */}` comment. Replace everything from that comment through the section's closing `</section>` (currently `src/app/page.tsx` lines 120-225 — re-locate by the comment text if line numbers have shifted since this plan was written) with:

```tsx
        {/* ATS PREVIEW SECTION */}
        <section id="analysis" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 border-t border-(--border)" suppressHydrationWarning>
          <div className="text-center mb-12" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">{atsPreviewContent.heading}</h2>
            <p className="text-(--muted) max-w-2xl mx-auto">{atsPreviewContent.subheading}</p>
          </div>

          <div className="relative flex flex-col items-center gap-6 lg:block lg:py-8" suppressHydrationWarning>
            <div className="w-full max-w-md lg:mx-auto" suppressHydrationWarning>
              <div className="rounded-2xl border border-white/10 bg-[#020202] p-3 sm:p-4" suppressHydrationWarning>
                <div className="mx-auto rounded-md border border-black/20 bg-white px-4 py-3 font-serif text-[#1F2937] shadow-[0_10px_28px_rgba(0,0,0,0.28)]" suppressHydrationWarning>
                  <div className="border-b border-gray-300 pb-1.5 text-center" suppressHydrationWarning>
                    <p className="text-base font-semibold uppercase tracking-wide text-[#111827]">John Doe</p>
                    <p className="mt-0.5 text-[10px] text-gray-700">(+1) 555 120 9087 • john.doe@email.com • linkedin.com/in/john-doe</p>
                  </div>

                  <div className="mt-2 space-y-2.5 text-[10.5px] leading-relaxed" suppressHydrationWarning>
                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">Professional Summary</h4>
                      <p className="mt-1 text-[#374151]">
                        Product-minded software engineer focused on backend reliability, distributed systems, and measurable business impact.
                      </p>
                    </section>

                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">Work Experience</h4>

                      <div className="mt-1" suppressHydrationWarning>
                        <div className="flex justify-between gap-3" suppressHydrationWarning>
                          <p className="font-semibold text-[#111827]">Senior Software Engineer, Atlas Commerce</p>
                          <p className="shrink-0 text-gray-600">2023 - Present</p>
                        </div>
                        <ul className="mt-0.5 list-disc pl-4 text-[#374151]">
                          <li>Led migration to event-driven services, reducing checkout failures.</li>
                          <li>Optimized PostgreSQL queries and caching, improving API latency from 410ms to 240ms.</li>
                        </ul>
                      </div>

                      <div className="mt-1.5" suppressHydrationWarning>
                        <div className="flex justify-between gap-3" suppressHydrationWarning>
                          <p className="font-semibold text-[#111827]">Backend Engineer, Cloudline Systems</p>
                          <p className="shrink-0 text-gray-600">2021 - 2023</p>
                        </div>
                        <ul className="mt-0.5 list-disc pl-4 text-[#374151]">
                          <li>Built internal observability tooling adopted by 8 product teams.</li>
                          <li>Implemented resilience patterns that improved uptime and reliability.</li>
                        </ul>
                      </div>
                    </section>

                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">Education</h4>
                      <p className="mt-1 text-[#374151]">B.Sc. in Computer Science, University of Bucharest</p>
                    </section>

                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">Technical Skills</h4>
                      <p className="mt-1 text-[#374151]">TypeScript, Node.js, Java, PostgreSQL, Redis, Docker, AWS, Kubernetes</p>
                    </section>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:absolute lg:top-8 lg:-left-4 xl:-left-12">
              <ResumeFindingsCard strengths={atsPreviewContent.findings.strengths} improvements={atsPreviewContent.findings.improvements} />
            </div>

            <div className="lg:absolute lg:top-24 lg:-right-4 xl:-right-12">
              <ResumeScoreCard score={atsPreviewContent.score} scoreLabel={atsPreviewContent.scoreLabel} categories={atsPreviewContent.categories} />
            </div>
          </div>
        </section>
```

Implementer notes:
- The "John Doe" fake-resume mockup markup (the white paper card: `rounded-2xl border border-white/10 bg-[#020202] p-3 sm:p-4` wrapper down through all four `<section>` blocks — Professional Summary, Work Experience, Education, Technical Skills) is copied byte-for-byte from the current file — its internal hex colors (`#1F2937`, `#111827`, `#374151`, `bg-white`, `border-gray-300`, `text-gray-600/700`, etc.) are DELIBERATELY left as hardcoded values, not tokenized. This mockup represents a printed white-paper resume, not part of the dark UI theme, so it should stay visually white/black regardless of the site's color tokens — same reasoning as why the reference site's own resume mockup doesn't follow their dark theme either.
- The small conic-gradient percentage badge that used to sit in the top-right corner of the mockup (the `absolute -right-3 -top-3 ... conic-gradient(#16DB65 ...)` block, previously lines 132-148) is DELETED — it's now redundant with the new standalone `<ResumeScoreCard>`, which is a bigger, more complete version of the same idea (score ring + breakdown) as a floating card, matching how the resumax reference does it (no small inline badge on the mockup itself, only the two floating cards carry the score/findings information).
- The old two-column `grid grid-cols-1 ... lg:grid-cols-[1.2fr_1fr]` wrapper, the glow-blob absolutely-positioned div, the old "Strengths" `<h3>`/list block, and the old "How to Improve" before/after box are all DELETED — replaced by `<ResumeFindingsCard>` and `<ResumeScoreCard>`.
- On screens below `lg`, the three blocks (mockup, findings card, score card) stack vertically in normal flow via `flex flex-col items-center gap-6` (no `absolute` positioning applies below `lg` since the `lg:` prefix gates it). At `lg` and above, the findings card floats to the upper-left and the score card floats to the upper-right, both overlapping the mockup, matching the resumax reference. Do not try to fine-tune the exact pixel offsets beyond what's given here — Task 5's visual verification step is where offset adjustments (if any) get decided, based on how it actually looks.
- `CheckCircle2` (used by the old "Strengths" list, now deleted) may become an unused import in `src/app/page.tsx` — check the rest of the file (the pricing/FAQ sections below, untouched by this task) for other uses before removing the import; only remove it if truly unused file-wide.

- [ ] **Step 3: Verify the full file compiles clean**

Run: `npx tsc --noEmit`
Expected: clean, no output.

Run: `npm run lint`
Expected: 0 errors (same 4 pre-existing unrelated warnings in `src/app/api/*` are fine).

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(design): rebuild resume-score section with floating card overlap layout"
```

---

### Task 5: Visual verification against the resumax.ai reference

**Files:** none (verification only)

- [ ] **Step 1: Screenshot the section**

The dev server should already be running at `http://localhost:3000` (confirm with a quick health check; start it if it's down). Use Playwright to navigate there, scroll to the `#analysis` section, and take a screenshot at a desktop viewport width (1440px, matching the reference captures from this session).

- [ ] **Step 2: Compare against the resumax.ai reference**

The reference screenshot from the original design-research session (session scratchpad, `03-section2.png` equivalent) showed: the findings card overlapping the top-left of the mockup, the score card overlapping the top-right and extending lower than the findings card, both with dark elevated surfaces and no heavy shadows. Report to the user:
- Do the two cards float over the mockup without looking broken/clipped at 1440px width?
- Does the circular gauge render correctly (conic-gradient ring, score number centered)?
- Do the category breakdown bars render with correct proportional widths?
- Does the section collapse gracefully to a stacked single column below `lg` (spot-check at a narrower viewport, e.g. 768px)?

- [ ] **Step 3: Report to user**

Show the screenshot(s) and comparison notes. Do not proceed to the next landing-page sub-section (the 5-step product loop) until the user confirms this one.
