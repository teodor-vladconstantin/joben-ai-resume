# Onboarding Tours and Activation Checklist: Design

**Date:** 2026-10-25
**Status:** Approved by user, pending implementation plan

## Goal

A real mobile visitor ran the free ATS scan, created an account, then left: the product is a desktop web app and nothing guided them. New users get guided help in every authenticated section:

1. A short spotlight tour per section, started on first visit, replayable from a "?" button.
2. An activation checklist in the dashboard that leads to the first exported PDF.

Success is measured in PostHog: share of new accounts that complete the dashboard tour, per-step drop-off, and share that reach `pdf_exported`.

## Decisions (from brainstorming)

| Topic | Decision |
| --- | --- |
| Shape | Per-section tours plus a dashboard checklist |
| Engine | `driver.js` (MIT, no React dependency, steps are data) |
| State | `users.onboarding` JSONB in Supabase, follows the user across devices |
| Mobile | No tours below 1024 px; the existing `MobileHandoffCard` stays the phone path |
| First-release sections | Dashboard, CV list, CV editor, cover letters list, AI Review |
| Settings and pricing | Out of scope for v1 |

## Architecture

### Tour registry

`src/lib/onboarding/tours.ts` holds one typed registry:

```ts
type TourId = 'dashboard' | 'resumes' | 'editor' | 'coverLetters' | 'aiReview'
type TourStep = { anchor: string; titleKey: string; bodyKey: string }
export const TOURS: Record<TourId, TourStep[]>
```

- `anchor` is the value of a `data-tour="..."` attribute placed on the real element. Class names and DOM structure are never used as selectors.
- Copy lives in `messages/ro.json` and `messages/en.json` under `Onboarding.<tourId>.<stepKey>.title|body`.
- Steps, as found in the code (new users do not see the stat cards, and the editor has one template and no template picker, so the first draft of this list changed):
  - **dashboard** (5): sidebar navigation, create button, activation checklist, ATS scan card (skipped when absent), referral card.
  - **resumes** (3): create button, first resume row, row actions. A brand-new user has no rows yet, so the first visit shows the create step only.
  - **editor** (5): section tabs, PDF import, AI tailor, live preview, save and export. `ResumeBuilder.tsx` has 2376 lines, so only these five anchors are added there.
  - **coverLetters** (3): create button, letter card, card actions.
  - **aiReview** (4): resume selector, run review, category scores, how to apply a fix.

### Launcher

`<TourLauncher tourId="..." />` is a client component mounted by each section's page. Four of the five section pages are client components, so the launcher loads the state itself through a server action instead of receiving it as a prop.

- On mount it checks `matchMedia('(min-width: 1024px)')`. Below that it renders nothing.
- Once the state has loaded, if the tour is not seen and the user is not `legacy`, it starts the tour 3 seconds later, so the cookie banner and PostHog survey settle first. The tour never starts before the state is known, so there is no flash for users who already saw it.
- Steps whose anchor is missing from the DOM are skipped. An empty tour is not started.
- Esc and the close button stop the tour. Finishing or stopping marks the tour as seen.
- A fixed "?" button (bottom corner, always on desktop) starts the tour on demand, regardless of `seen` and `legacy`.
- `driver.js` is imported dynamically inside the launcher, so it only loads when a tour runs.
- Popover styling uses the existing CSS variables (`--surface`, `--foreground`, `--accent`, `--border`) so dark and light themes both work.

### State

Column `users.onboarding jsonb not null default '{}'`:

```json
{ "legacy": true, "tours": { "dashboard": "2026-10-25T12:00:00Z" }, "checklistDismissedAt": "2026-10-25T12:00:00Z" }
```

- New migration (`supabase migration new onboarding_state`) adds the column and sets `{"legacy": true}` on every row that exists at migration time. Existing users never get automatic tours; they can start any tour from "?".
- Server action in `src/lib/actions` (`markTourSeen(tourId)`, `dismissChecklist()`) reads `auth()`, updates only the current user's row, and validates `tourId` against the registry.
- If the `users` row does not exist yet (the Clerk webhook can lag right after sign-up), the server action writes with an upsert on `clerk_id`; the webhook's own upsert never touches `onboarding`.
- If the state cannot be read, the server action returns a `legacy` state, so a database error never starts a tour.
- No service role key reaches the client.

### Activation checklist

`ProfileCompletion` becomes the activation checklist.

- Four items: resume created, AI review run, cover letter created, PDF exported. All four derive from existing stats (`getUserDashboardStats`); no new completion state is stored.
- Each item links to the page that completes it.
- "Close" persists in `users.onboarding.checklistDismissedAt` instead of component state, so it stays closed after a refresh.
- The card disappears by itself at 4 of 4.
- The PDF-exported count comes from `product_events` (`resume_exported_pdf`); the stats query is extended accordingly.

## Analytics

PostHog events from the launcher, all with `tourId`: `tour_started` (with `trigger: auto | manual`), `tour_step_viewed` (with `stepIndex`), `tour_completed`, `tour_skipped` (with `stepIndex`). They respect the existing cookie consent, like every other client event.

## Error handling

- If the server action fails, the tour closes normally and the failure is logged. The user may see the tour once more on the next load; nothing else breaks.
- A tour never blocks interaction beyond its spotlight, and always closes with Esc.
- Missing anchors never throw.

## Testing

- Unit: the registry (every step has a title and body in both locales, step anchors are unique within a tour), `markTourSeen` rejects an unknown `tourId` and writes only the caller's row, the checklist item derivation.
- Migration reviewed with the `migration-reviewer` agent before applying.
- Manual in a real browser on a brand-new account: each tour starts once, "?" replays it, Esc closes it, state survives a reload and a second device, nothing runs below 1024 px.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` stay green.

## Out of scope

- Tours on phones (the handoff card covers that path).
- Tours for settings and pricing.
- Automatic tours for users who existed before this ships.
- Email reminders for users who did not finish the checklist.
- A/B testing the tours.
