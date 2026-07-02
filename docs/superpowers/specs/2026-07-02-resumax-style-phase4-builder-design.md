# ResuMax-Style Redesign — Phase 4: Resume Builder — Design

## Goal

Restyle Joben's resume list page (`/resumes`) and resume builder editor (`/resumes/new`, `/resumes/[id]`) onto the Phase 0-3 design system (tokens, `Button`/`Card`/`Badge` primitives), matching resumax.ai's visual language for the equivalent surfaces — same process as Phases 0-3: same data, same logic, same interactions, only the visual layer changes.

## Scope

**In scope:**
- `src/app/resumes/page.tsx` (resume list) — adopts the `Sidebar` layout (same pattern as `/dashboard` from Phase 3), restyled list rows/search/sort onto tokens.
- `src/components/builder/ResumeBuilder.tsx` (2176 lines) and its satellite components — restyled onto tokens: `src/components/builder/SectionPanel.tsx`, `src/components/builder/AddContentModal.tsx`, `src/components/builder/TemplateSwitcher.tsx` (single "Harvard" option, no new choices), `src/components/builder/ResumeOnboardingModal.tsx`, `src/components/ui/UpgradeModal.tsx`, `src/components/ui/BeforeAfterModal.tsx`.
- New shared primitive: `src/components/ui/Modal.tsx` (header/body/footer shell), adopted by all 4 modal components in the builder (`AddContentModal`, `UpgradeModal`, `BeforeAfterModal`, `ResumeOnboardingModal`).

**Explicitly out of scope (deferred to later phases):**
- `/cover-letters`, `/ai-review`, `/settings` — remain on the old `Navbar`, not touched this phase.
- resumax's multi-template/font/spacing/margin/accent-color/column/page-size customization system — Joben keeps its current single-template behavior. Building that system out is a separate, much larger feature project, not a restyle.
- Any change to data-fetching, autosave, AI actions (bullet optimization, tailor-to-job, resume analysis), PDF import, or PDF/DOCX export logic. Visual-only, exactly like Phases 0-3.

## Reference research (resumax.ai, logged-in session)

Observed via Playwright against the account's real session:
- **Documents overview** (`/documents`): tabbed sub-nav (Overview/Resumes/Cover Letters/AI Review) — already effectively replicated by Joben's own `/dashboard` from Phase 3, not re-copied here.
- **Resumes list** (`/documents/resumes`): row list — search bar, sort dropdown, "New resume" pill CTA, each row = icon + title + subtitle (source · date) + score-or-"NOT REVIEWED" badge + Edit/Review pill buttons, pagination footer.
- **Builder editor** (`/edit/[id]`): global app `Sidebar` present + a self-contained 2-pane sub-layout to its right:
  - Top bar: Back link, editable title, "● Saved" status pill, "Tailor to Job" CTA, template-name pill, DOCX button, "Download PDF" primary CTA.
  - Left form panel (independently scrollable): tab switcher (Edit/Atlas) → "Resume Readiness" checklist (segmented progress bar + dot-marked category list) → "Resume Sections" list (expand/collapse chevron, status dot, edit/add-entry icons, nested entry rows with edit/delete icons) → "Add Section" + "Import from PDF" buttons → customization controls (template/font/size/spacing/margins/color/columns/page-size — **not replicated**, see Scope).
  - Right preview panel: "Live preview · exact match to your download" label + a literal white page with black serif resume typeset (this does NOT take on the dark palette — it mirrors the PDF output).
  - Entry-edit modal: uppercase mono title + X close, 2-column fields, bullet list editor with per-bullet AI "Optimize Bullet" action, Delete/Cancel/Save footer.
  - "Add Content" modal: 3×2 grid of icon+title+description cards — confirmed near 1:1 parity already with Joben's own `AddContentModal.tsx` section types (professional_summary, career_objective, education, leadership, projects, research, certifications, awards, publications, skills), so this phase is realistically a visual pass, not a content/IA rework.
  - "Tailor to a Job" modal: compact, tab switcher (Pipeline/For you/Paste), primary CTA.
  - Mobile (≤768px): 2-pane split collapses to a single pane with a bottom tab bar (Sections/Preview/Optimize/Templates).

## Layout decisions

- **`/resumes` (list)**: gets `<Sidebar/>` exactly like `/dashboard` (Phase 3 pattern: `hidden lg:flex` Sidebar + `lg:hidden`-wrapped `Navbar` fallback below that breakpoint). Closes the jarring style gap where Sidebar's own "Resumes" nav link currently drops the user onto an unstyled page.
- **Builder editor** (`/resumes/new`, `/resumes/[id]`): **no Sidebar** — full-width "focus mode," just a "← Back" affordance in the top bar. Diverges from resumax's own choice (which keeps its global Sidebar in the editor) because the form+preview split already needs significant horizontal room, and a distraction-free editing surface is a deliberate product choice, not an oversight.

## Component plan

- `Modal.tsx` (new primitive): header (uppercase mono title + X close), body (scrollable), footer (action buttons slot). Built first since 4 existing modals depend on it.
- `src/app/resumes/page.tsx`: full restyle onto tokens + `Sidebar` adoption, same fetch/delete/sort/search logic.
- `ResumeBuilder.tsx`: restyled in-place (not extracted into smaller files — see Risk below) region by region:
  - Outer shell / top bar (Back, title, status, action buttons via `Button` primitive)
  - Personal Info + Experience section UI (form fields, section-list rows, readiness checklist tied to these categories)
  - Projects + Education section UI
  - Skills + dynamic/custom sections UI
  - Live preview panel chrome (label, page border/shadow) — the actual `HarvardTemplate` typeset stays print-realistic (white/black/serif), untouched by the dark palette
- `AddContentModal.tsx`, `UpgradeModal.tsx`, `BeforeAfterModal.tsx`, `ResumeOnboardingModal.tsx`: migrated onto the new `Modal` primitive and restyled.

## Risk: the 2176-line `ResumeBuilder.tsx`

Unlike Phase 3's small widget files (safe to fully replace in one shot), this file is too large and logic-dense for "replace full file content" tasks — too easy for a subagent to silently drop or alter a handler while rewriting that much JSX in one pass. Mitigation:
- Edits are **surgical, region-scoped**, using `Edit` with exact `old_string`/`new_string` snippets bounded to ~50-150 lines at a time — never a full-file `Write`.
- No hook/state/handler/prop signature is touched — only `className` values and static JSX structure (wrapper divs, icons, labels).
- Every sub-step ends with `tsc --noEmit` plus a diff review that explicitly checks no logic lines fall inside the changed hunks (same rigor Phase 3 applied to `getUserDashboardStats` etc.).
- No premature extraction into smaller components — CLAUDE.md's "don't refactor beyond what's needed" applies; restyling in place is sufficient and lower-risk than moving code during a visual-only pass.

## Execution granularity (user-mandated)

Given the file's size and risk, this phase runs at finer granularity than Phases 0-3, with **live Playwright verification and explicit user confirmation after every sub-step**, not just at phase end:

1. `Modal` primitive
2. `/resumes` list page (Sidebar adoption + restyle)
3. Builder shell (top bar + full-width layout, no Sidebar)
4. Personal Info + Experience section UI
5. Projects + Education section UI
6. Skills + dynamic sections UI
7. All 4 modals migrated onto `Modal` primitive
8. Live preview panel chrome
9. Full functional + visual verification (real seeded resumes: autosave, PDF import, PDF/DOCX export, AI tailor/optimize-bullet, responsive collapse)

## Testing / verification

- After each sub-step: `npx tsc --noEmit`, targeted diff review, live Playwright screenshot against the already-seeded local Supabase data (2 resumes, 1 cover letter, 2 ai_reviews from Phase 3's session) — reused, not re-seeded unless the session was lost.
- Sub-step 9 (final): confirm autosave still persists edits, PDF import still parses a real file, PDF/DOCX export still produce valid downloads, "Optimize Bullet" and "Tailor to Job" AI calls still round-trip correctly, mobile breakpoint collapses without breaking navigation, `npx tsc --noEmit` / `npm run lint` / `npm test` all clean.
