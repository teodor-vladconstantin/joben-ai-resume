## Active

- [IN PROGRESS] Final launch execution gates (Vercel deploy + service keys)
- [ ] Connect repo to Vercel (vercel.com/new), set all env vars in Vercel Dashboard
- [ ] Add GitHub Actions secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID + NEXT_PUBLIC_* vars
- [ ] Deploy LaTeX service Docker container (VPS/Railway/Fly.io), set LATEX_SERVICE_URL in Vercel env
- [ ] Configure Clerk webhook: add production endpoint https://yourapp.vercel.app/api/webhooks/clerk
- [ ] Configure Stripe webhook: add production endpoint https://yourapp.vercel.app/api/webhooks/stripe
- [ ] Execute smoke flow (auth -> create -> analyze -> export -> checkout -> verify billing)

## Definition of Done (DoD)
- [x] Code implemented and manually sanity-checked on affected flow
- [x] npx tsc --noEmit passes
- [x] npm run lint passes (errors = 0)
- [x] npm run build passes
- [x] TODO status updated (Active -> Done)

## Phase Backlog
- [x] Phase 3 P0 (Owner: Platform): add test runner (Vitest) and npm test script
- [x] Phase 3 P0 (Owner: Platform): add parser tests for multilingual resume extraction
- [x] Phase 3 P1 (Owner: Platform): add API smoke tests for critical routes (analyze, tailor, improve-bullet, webhooks)
- [x] Phase 4 P0 (Owner: Platform): introduce structured logger utility and migrate critical server paths
- [x] Phase 4 P1 (Owner: Platform): add request correlation id support in critical API routes
- [x] Phase 5 P1 (Owner: Product): add dashboard email tracking page using email_events
- [x] Phase 5 P1 (Owner: Product): add AI review trend/comparison for same resume on review details
- [x] Phase 5 P2 (Owner: Product): add basic funnel instrumentation (create -> analyze -> improve -> export -> upgrade)
- [x] Phase 6 P0 (Owner: Platform): expand README with local setup (including Supabase local)
- [x] Phase 6 P0 (Owner: Platform): add RUNBOOK with cron/health/webhook/incident response/rollback
- [x] Phase 6 P1 (Owner: Platform): add troubleshooting section for optional integrations/env



## Done

- [DONE] Implemented JOBEN100 redeem flow for instant lifetime Recruiting access (DB migration + API + dashboard UI + Stripe webhook protection + tests)
- [DONE] Diagnosed bullet AI prompt/call path and clarified rate-limit vs Anthropic-call behavior in API/UI messaging
- [DONE] Debugged production Clerk auth issue and hardened custom auth routing defaults in app/middleware/env template
- [DONE] Switched deployment to Vercel (removed VPS/Traefik/self-hosted Supabase from docker-compose; added vercel.json with cron config; updated CI/CD workflow)
- [DONE] DB migration `20260419193000_add_users_stripe_last_event_created.sql` applied to Supabase Cloud (ResumeAIMax / vdgjxejunpfxvnpxyazq)
- [DONE] docker-compose.prod.yml reduced to LaTeX service only
- [DONE] Hardened Stripe webhooks with event-order protection (`stripe_last_event_created`) and added subscription/invoice event sync coverage
- [DONE] Extended `/api/health` with Redis and LaTeX probes plus stricter production readiness conditions
- [DONE] Added automated DB backup service and operational resource limits in `docker-compose.prod.yml`
- [DONE] Added automated `followup-cron` scheduler container with configurable cadence/target URL
- [DONE] Added optional alert webhook support in logger (`ALERT_WEBHOOK_URL`, `ALERT_MIN_LEVEL`)
- [DONE] Added migration `20260419193000_add_users_stripe_last_event_created.sql` and updated runbook/env templates
- [DONE] Secured internal PDF compile flow with LATEX_SERVICE_SECRET between app export route and latex-service (plus prod env wiring)
- [DONE] Changed API rate limiting fallback to fail-closed when Upstash Redis is missing or rate limit checks fail
- [DONE] Fixed resume builder sidebar flex+scroll collapse on Experience tab by locking header/footer and using min-h-0 scroll region
- [DONE] Added FAQ section on homepage (below Pricing) with 8 expandable questions
- [DONE] Upgraded @anthropic-ai/sdk to 0.90.0 and added persistent patch-package fix for SDK tsconfig moduleResolution deprecation
- [DONE] Updated Free pricing copy from "1 Word download" to "1 PDF download"
- [DONE] Removed create-resume onboarding modal so /resumes/new opens directly in builder
- [DONE] Removed "or unlimited" from Recruiting pricing card and re-validated Upstash daily+monthly limit wiring
- [DONE] Migrated Anthropic API runtime model to Haiku (`ANTHROPIC_MODEL` override, Haiku default)
- [DONE] Implemented requested limits: Free bullet rewrites teaser only, Pro daily+monthly caps, Recruiting unlimited/high-volume behavior
- [DONE] Updated pricing copy to match new plan limits (Free/Pro/Recruiting)
- [DONE] Resolved local Internal Server Error by clearing stale dev process on port 3000 and restarting clean Next.js runtime
- [DONE] Pricing card polish: removed monthly credits line from Pro card and fixed check/X icon size consistency on wrapped text
- [DONE] Enforced Upstash API monthly limits on AI endpoints (analyze, tailor, improve-bullet, cover-letter) with plan-aware caps
- [DONE] Hardened GOD MODE resolution via Clerk session email hint so admin keeps unlimited plan capabilities even if DB email is stale
- [DONE] Builder desktop layout fixed with stable column widths and non-squeezing preview pane
- [DONE] Added GOD MODE override for duku.constantin@gmail.com with full plan access
- [DONE] Fix Experience tab visual shrink by stabilizing tab width and scrollbar gutter in builder editor
- [DONE] Centralized plan definitions and enforced per-plan quotas (Free: 3 resumes, 1 export) plus AI gating by plan
- [DONE] Full roadmap closure: phases 0-6 implemented with tests, observability, analytics, and operational documentation
- [DONE] UX polish: better sections spacing in builder and keep Harvard as the only resume template
- [DONE] Phase 3 P0: Deploy workflow quality gates + post-deploy health polling
- [DONE] Phase 3 P0: Clear blocking lint errors to enable CI quality gates
- [DONE] Phase 2 P1: Resume list Analyze action with direct AI review creation flow
- [DONE] Phase 1 P0: Idempotent followup-7d cron flow with retry-safe email event locking
- [DONE] Phase 1 P0: Webhook idempotency (Clerk + Stripe) and email event dedup safeguards
- [DONE] Add branded horizontal scroll for sidebar tab row
- [DONE] Improve PDF parsing for education, projects, skills, and certifications sections
- [DONE] Improve PDF experience parsing into separate jobs and bullet points


