# ResuMax-Style Redesign — Phase 5: Cover Letters + AI Review — Design

## Goal

Restyle `/cover-letters` (list + editor) and `/ai-review` (landing/list + detail report) onto the Phase 0-4 design system (tokens, `Button`/`Card`/`Modal` primitives), matching resumax.ai's visual language for the equivalent surfaces — same process as Phases 0-4: same data, same logic, same interactions, only the visual layer changes.

## Scope

**In scope:**
- `src/app/cover-letters/page.tsx` (list, 155 lines) — adopts `Sidebar`, restyled onto tokens.
- `src/components/cover-letter/CoverLetterBuilder.tsx` (616 lines), `ParagraphModal.tsx` (82 lines), `SectionList.tsx` (36 lines) — restyled onto tokens. Editor pages (`src/app/cover-letters/[id]/page.tsx`, `src/app/cover-letters/new/page.tsx`) keep their current `Navbar`-only shell (no `Sidebar`), matching `ResumeBuilder`'s established full-width focus-mode pattern.
- `src/app/ai-review/page.tsx` (landing/list, 447 lines) — adopts `Sidebar`, restyled onto tokens.
- `src/app/ai-review/[id]/page.tsx` (288 lines) — adopts `Sidebar`, restyled onto tokens.
- `src/components/analyzer/ResumeAnalyzer.tsx` (330 lines) — restyled onto tokens.
- `ParagraphModal` and the inline "Auto-fix unavailable" modal block in `ai-review/[id]/page.tsx` migrated onto the `Modal` primitive (Phase 4). `UpgradeModal` (already migrated in Phase 4) is inherited automatically by both features.

**Explicitly out of scope:**
- `/settings` — does not exist yet (empty route directory, currently 404s). Building it is a new feature with its own content decisions (account info? billing? password?), not a restyle. Deferred to its own future phase.
- Any change to data-fetching, autosave, AI actions (cover letter generation, apply-fix, auto-fix, resume analysis), or PDF/DOCX export logic. Visual-only, exactly like Phases 0-4.
- Building out any of resumax's paywalled/Pro-gated UI observed during research (cover letter content and "what the panel found" findings were blurred behind an upgrade paywall on the reference account) — Joben's existing free-tier-visible content stays as-is, just restyled.

## Reference research (resumax.ai, logged-in session)

- **Cover Letters list** (`/documents/cover-letters`): identical row-list pattern to the Resumes list (search bar, "New cover letter" pill CTA, icon+title+date rows) — same restyle recipe as Phase 4 Task 2 applies directly.
- **Cover Letter editor** (`/cover-letter/[id]`): top bar (Back, eyebrow "COVER LETTER" + title, "Upgrade to download" CTA) visible; the actual editing surface was paywalled/blurred on the reference account (Pro-gated), so no further structural reference was available. Not a blocker — Joben's own `CoverLetterBuilder.tsx` already has an established, working IA; per the Phase 4 precedent (pure restyle, no IA changes), this phase reskins whatever structure already exists rather than reconstructing resumax's inaccessible layout.
- **AI Review list** (`/documents/review`): 4-stat-card row (Reviewed / Best score / In hire zone / Awaiting review) + search + "Upload a PDF" pill CTA + row list (icon, title, status/score) — same stat-card and row-list language already established in Phase 3's `StatCards` and Phase 4's list restyles.
- **AI Review detail** (`/review/[id]`): 2-column report layout — left "PDF PREVIEW" panel, right "Your resume scored" hero card (big score + description) + category breakdown list + findings list (paywalled on the reference account, blurred with an unlock CTA). Structurally close to Joben's own `ResumeAnalyzer.tsx` (score + category breakdown + improvements list with Apply Fix/Auto-fix) — same "pure restyle of existing IA" approach applies.

## Layout decisions

- **`/cover-letters` (list) and `/ai-review` (landing + detail)**: adopt `<Sidebar/>` exactly like `/dashboard` (Phase 3) and `/resumes` (Phase 4) — `hidden lg:flex` Sidebar + `lg:hidden`-wrapped `Navbar` fallback below that breakpoint.
- **Cover Letter editor** (`/cover-letters/[id]`, `/cover-letters/new`): **no Sidebar**, full-width focus mode — consistent with `ResumeBuilder`'s established pattern (a form+preview split needs the horizontal room, and distraction-free editing is a deliberate, already-precedented choice).
- **`/ai-review/[id]` (report)**: gets `<Sidebar/>` — unlike the builders, this is a report/read surface, not a two-pane form+live-preview split fighting for width, so it doesn't need the same full-width treatment.

## Component plan

- `src/app/cover-letters/page.tsx`: full restyle onto tokens (same recipe as Phase 4 Task 2), `Sidebar` adoption, same fetch/delete/sort/search logic. Bug fix: `divide-y divide-[#0A9548]` → `divide-(--border)`, delete/row no-op hovers fixed (identical bugs to pre-Phase-4 `/resumes`, since the code was originally copy-pasted from the same source).
- `CoverLetterBuilder.tsx`, `SectionList.tsx`: restyled in place onto tokens, same handlers/state/logic untouched. Region-scoped edits if the file structure warrants it (616 lines is smaller than `ResumeBuilder.tsx` but still large enough to treat with the same surgical-edit discipline established in Phase 4, not a blind full-file rewrite).
- `ParagraphModal.tsx`: migrated onto the `Modal` primitive.
- `src/app/ai-review/page.tsx`: full restyle onto tokens, `Sidebar` adoption, same fetch/upload/analyze logic. Bug fix: `error` state rendered in `text-[#16DB65]` (bright accent green) — the same error-colored-as-success bug already fixed three times in this codebase (Phase 3's `RedeemCodeCard`, Phase 4's Personal Info summary error and bullet-draft error) — fixed to `text-red-400`.
- `src/app/ai-review/[id]/page.tsx`: `Sidebar` adoption, restyle, inline "Auto-fix unavailable" modal migrated onto `Modal`.
- `ResumeAnalyzer.tsx`: restyled onto tokens, same props/logic untouched.

## Risk

None of the touched files individually approach `ResumeBuilder.tsx`'s scale (2176 lines) — the largest, `CoverLetterBuilder.tsx`, is 616 lines. Region-scoped surgical edits (verified `old_string`/`new_string`, never a blind full-file rewrite for anything over ~150 lines) remain the standard for files in the 300-600 line range; smaller files (list pages, modals, `ResumeAnalyzer.tsx`) can use full-file replacement like Phase 3's widgets, since they're small enough to hold and verify in full.

## Execution granularity

Live Playwright verification and user confirmation after every task, same standard as Phase 4:

1. `/cover-letters` list (Sidebar + restyle + bug fixes)
2. `CoverLetterBuilder.tsx` shell + form content
3. `ParagraphModal` migrated to `Modal` + `SectionList` restyled
4. `/ai-review` landing (Sidebar + restyle + error-color bug fix)
5. `/ai-review/[id]` + `ResumeAnalyzer.tsx` (Sidebar + restyle + auto-fix modal migrated to `Modal`)
6. Full functional + visual verification with real seeded data (cover letter generation, AI review flow, apply-fix/auto-fix, responsive collapse)

## Testing / verification

- After each task: `npx tsc --noEmit`, targeted diff review confirming only color-bearing classes changed, live Playwright screenshot against the already-seeded local Supabase session.
- Final task: confirm cover letter autosave/generation still works, AI review analyze/apply-fix/auto-fix flows still work (or fail only for the same pre-existing environment reasons documented in Phase 4 — missing `ANTHROPIC_API_KEY`/`latex-service`, not a regression), responsive collapse holds, `npx tsc --noEmit` / `npm run lint` / `npm test` all clean.
