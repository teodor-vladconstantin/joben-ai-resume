# Joben Resume Runbook

## Purpose
This runbook defines routine operations, incident response, and rollback procedures for Joben Resume production.

## System Topology
- `next-app`: main Next.js application — deploys to **Vercel**; env vars are set in the Vercel Dashboard, not in this repo
- `supabase`: Postgres + APIs — Supabase Cloud (not self-hosted)
- `latex-service`: PDF compile microservice — self-hosted on a VPS via `docker-compose.prod.yml`
- `resume-parser`: PDF/DOCX parsing — also self-hosted on the VPS alongside `latex-service`
- `traefik`: reverse proxy/TLS in front of the VPS services only (not in front of the Next.js app, which Vercel fronts itself)

## Critical Endpoints
- Health: `/api/health`
- Clerk webhook: `/api/webhooks/clerk`
- Stripe webhook: `/api/webhooks/stripe`
- Follow-up cron: `/api/cron/followup-7d`
- Stripe checkout: `/api/billing/checkout`
- Stripe billing portal (manage/cancel subscription): `/api/billing/portal`

## Daily Checks
1. Verify app health endpoint returns `200` and `status=ok`.
2. Verify no spike in failed webhook event claims in `webhook_events`.
3. Verify `email_events` has stable sent/failed ratio.
4. Verify Stripe webhook events are being processed (no backlog/replay loop).
5. Verify Redis/Upstash probe is `ok` in health checks (rate limiting backend available).
6. Verify LaTeX service probe is `ok` and internal auth is configured (`LATEX_SERVICE_SECRET`).
7. Verify latest DB backup artifact is present and fresh (<= 24h old).

## Deploy Procedure
1. Ensure branch is green: `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build`.
2. Merge and trigger deploy workflow.
3. Confirm post-deploy health polling passes.
4. Run a smoke flow:
   - Sign in
   - Create resume
   - Start AI review
   - Improve a bullet
   - Export PDF
   - Start checkout

## Cron Operations
Endpoint: `/api/cron/followup-7d`
Auth header options:
- `Authorization: Bearer <CRON_SECRET>`
- `x-cron-secret: <CRON_SECRET>`

Safe execution:
1. Run dry-run first.
2. Check candidate count and expected recipients.
3. Run live request with bounded `limit`.
4. Inspect `email_events` for `status=sent` and failures.

Production scheduler:
- `followup-cron` service triggers follow-up endpoint automatically.
- Control cadence with `FOLLOWUP_CRON_INTERVAL_SECONDS`.
- Control target route/query with `FOLLOWUP_CRON_TARGET_URL`.

Examples:
```bash
curl -X POST "https://<host>/api/cron/followup-7d?dryRun=true&limit=25" -H "Authorization: Bearer <CRON_SECRET>"
curl -X POST "https://<host>/api/cron/followup-7d?limit=100&retries=1" -H "Authorization: Bearer <CRON_SECRET>"
```

`/api/cron/redis-health` pings Upstash and alerts via `logger.error` (→ Sentry) on failure. It is **not** registered in `vercel.json` — this project is on Vercel's Hobby plan, which caps cron jobs at 2 total and daily-only frequency, and both slots are already used by `followup-7d`/`inactivity-3d`. Instead, `.github/workflows/redis-health-cron.yml` pings it every 30 minutes via GitHub Actions (free, no Vercel plan dependency). It needs two repo secrets set once under GitHub → Settings → Secrets and variables → Actions:
- `PROD_APP_URL` — the production URL (e.g. `https://joben.eu`)
- `CRON_SECRET` — same value as the app's `CRON_SECRET` env var

GitHub Actions `schedule` triggers are best-effort and can lag during high platform load, so treat this as "checked every ~30 min," not real-time. If the project later moves to Vercel Pro, this can be added back to `vercel.json` instead: `{"path": "/api/cron/redis-health", "schedule": "*/15 * * * *"}`, and the workflow file can be removed.

## Local Stripe Testing
Use the [Stripe CLI](https://docs.stripe.com/stripe-cli) to forward live test-mode
webhook events to your local dev server instead of manually POSTing fixtures:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

`stripe listen` prints a `whsec_...` signing secret — put that in your local
`STRIPE_WEBHOOK_SECRET` (it's different from the Dashboard's registered
endpoint secret). Then in a second terminal, trigger individual events:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
stripe trigger charge.refunded
```

Use Stripe's [test card numbers](https://docs.stripe.com/testing) (e.g.
`4242 4242 4242 4242`, any future expiry, any CVC) to drive a real checkout
session end-to-end through `/api/billing/checkout` and confirm the webhook
updates `users.plan` as expected.

## Stripe Live Cutover Checklist
One-time steps to take Stripe payments live. Steps 1-4 require access to the
Stripe and Vercel Dashboards and must be done by a human with account access —
they cannot be automated from this repo. Run step 5 (test-mode dry run)
*before* step 6 (flipping to live keys) every time, even on repeat cutovers
after a rollback.

1. **Stripe Dashboard, live mode**: create two subscription prices — the live
   `price_...` IDs differ from the test-mode price IDs already in use:
   - **Pro**: recurring, `€12` every 1 month.
   - **Recruiting Plan**: recurring, `€60` every 6 months (`interval: month,
     interval_count: 6`).
2. **Stripe Dashboard, live mode**: register the webhook endpoint
   `https://<prod-domain>/api/webhooks/stripe`. Select exactly the 7 event
   types the handler processes — not "all events" — to keep `webhook_events`
   free of irrelevant rows:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`, `invoice.paid`, `charge.refunded`.
   Copy the live `whsec_...` signing secret.
3. **Stripe Dashboard, live mode**: activate the Customer Portal default
   configuration (Settings → Billing → Customer portal). This is required for
   `/api/billing/portal` to work in live mode and is a separate one-time
   toggle from test mode. Add **both** the Pro and Recruiting Plan prices to
   the portal's "products customers can switch to" list so an existing
   subscriber can move between the two plans from the portal.
4. **Vercel Dashboard**: set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `STRIPE_PRO_PRICE_ID`, `STRIPE_RECRUITING_PRICE_ID` (the live values from
   steps 1-2) as Production environment variables. This is the only place
   production secrets live — there is no env file in this repo with real
   values.
5. **Pre-flight in test mode first**, against the deployed app (Stripe still
   in test mode): run the full smoke flow for **both** plans — sign in →
   create resume → analyze → export → checkout with test card
   `4242 4242 4242 4242` (once via "Upgrade to Pro", once via "Get Recruiting
   Plan") → confirm the webhook updates `users.plan` to the correct plan for
   each → open the billing portal → cancel → confirm the webhook downgrades
   the plan. Also confirm a `lifetime_recruiting_unlocked` test user is never
   downgraded by any of the above (see the `lifetime_recruiting_unlocked` test
   cases in `tests/api/webhooks-stripe.test.ts` for the exact behavior being
   verified manually here).
6. **Flip Vercel env vars to the live values from steps 1-2 and redeploy.**
7. **Live smoke test**: one real low-value charge per plan (cheapest
   configured price, or a Dashboard-created $0/$1 coupon — Stripe test clocks
   don't work against live keys). Confirm checkout → webhook → plan update →
   portal cancel/refund → webhook downgrade, all in live mode, for both Pro
   and Recruiting Plan. Refund/cancel immediately after confirming.
8. **Confirm monitoring**: verify the webhook route's `logger.error` calls
   (signature failures, DB update failures, claim failures) are visibly
   flowing into Sentry, and that alert thresholds are sane for a burst of
   webhook failures.
9. **If anything breaks post-launch**: set `CHECKOUT_DISABLED=true` in Vercel
   and redeploy — this pauses new checkouts instantly while leaving the
   webhook handler running (existing subscribers' refunds/cancellations must
   keep processing regardless). See "Checkout failures for Pro upgrades"
   below for further diagnosis.
10. Check off the two Stripe items in `TODO.md`'s pre-launch checklist once
    this is genuinely done.

## Incident Playbooks

### 1) Health endpoint degraded
1. Check environment variables for missing required keys.
2. Check DB connectivity and Supabase service availability.
3. Review latest deploy diff for config/runtime changes.
4. If unresolved quickly, roll back deployment.

### 2) Clerk users not syncing to Supabase
1. Confirm `CLERK_WEBHOOK_SECRET` matches webhook config.
2. Replay recent events from Clerk dashboard.
3. Inspect `webhook_events` for duplicate or failed claim patterns.
4. Check server logs for request-id correlated failures.

### 3) Stripe plans not updating
1. Confirm webhook endpoint is reachable and signed correctly.
2. Validate `STRIPE_WEBHOOK_SECRET`.
3. Replay relevant events: `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_failed`, `charge.refunded`.
4. Inspect `users.plan`, `users.stripe_customer_id`, and `users.stripe_subscription_id`.

### 4) Follow-up emails failing
1. Inspect `email_events` failed records and `error` payload.
2. Verify `RESEND_API_KEY` and sender identity.
3. Retry cron with low limit and `retries=1`.
4. Track `source_event_id` to avoid duplicate sends.

### 5) Rate limiting degraded or bypass risk
1. Confirm `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set and valid.
2. Verify health check shows `rateLimitBackend=ok`.
3. By design, `src/lib/ratelimit.ts` and `src/lib/security/route-rate-limit.ts` **fail open** when Redis is unreachable — a deliberate availability tradeoff (a missing/degraded Redis must not lock users out of the product), not a bug. The one deliberate exception is `/api/signup/consent`, which fails **closed** (503) on missing Redis, since it is a low-traffic, abuse-specific gate rather than an AI-quota hot path.
4. `/api/cron/redis-health` pushes a `logger.error` (→ Sentry) when Upstash is unreachable, so a Redis outage is now alerted instead of silently degrading quota enforcement — but it needs an external scheduler to actually fire on Vercel Hobby (see "Cron Operations" above). Check Sentry for `Upstash Redis health check failed` if you suspect an outage went unnoticed, and confirm the external scheduler is still active if alerts have gone quiet for a suspiciously long time.
5. Restore Redis connectivity before reopening traffic; there is no need to change the fail-open code path to recover — it self-heals once Redis is reachable again.

### 6) Checkout failures for Pro/Recruiting Plan upgrades
1. Verify `STRIPE_SECRET_KEY` and the price id for the plan being purchased
   (`STRIPE_PRO_PRICE_ID` or `STRIPE_RECRUITING_PRICE_ID`) — the checkout
   route accepts `{ "plan": "pro" | "recruiting" }` in the POST body
   (defaults to `"pro"`) and returns 503 without leaking which var is missing
   if the corresponding price id isn't configured.
2. Confirm `CHECKOUT_DISABLED` is not set to `"true"` — this is the deliberate kill switch (see `src/app/api/billing/checkout/route.ts`); it returns 503 before any other check runs.
3. Verify app URL and allowed return URLs.
4. Test `/api/billing/checkout` manually under authenticated user, for both plans.
5. Inspect product funnel event `checkout_started` for request-level visibility (includes the `plan` property).

### 8) Billing portal failures ("Manage billing" button)
1. Verify `STRIPE_SECRET_KEY` is set.
2. Confirm the user has a `stripe_customer_id` in `public.users` — the portal route 404s with a clear message if not (they've never checked out).
3. In Stripe Dashboard → Settings → Billing → Customer portal, confirm the default configuration is activated for the relevant mode (test/live) — the portal route errors if it isn't, since Stripe requires this one-time manual setup per mode.
4. Test `/api/billing/portal` manually under an authenticated user with an active subscription.

### 7) PDF export service unauthorized/unavailable
1. Verify `LATEX_SERVICE_SECRET` exists in both app and latex-service containers.
2. Test latex service health endpoint from app network with auth header.
3. Confirm app-to-latex request includes `Authorization: Bearer <LATEX_SERVICE_SECRET>`.
4. If auth mismatch is detected, rotate the shared secret and redeploy both services.

## Rollback Procedure
1. Identify last known good commit SHA.
2. Redeploy that SHA through CI/CD pipeline.
3. Validate `/api/health` and key smoke flow.
4. Monitor webhooks and cron for 15 minutes after rollback.
5. Open incident follow-up ticket with root cause and corrective action.

## Observability Reference
- `webhook_events`: incoming webhook claim ledger
- `email_events`: email pipeline outcomes
- `product_events`: user funnel instrumentation

Alerting:
- Optional outgoing alerts can be enabled with `ALERT_WEBHOOK_URL`.
- Minimum severity is controlled by `ALERT_MIN_LEVEL` (`info` | `warn` | `error`).

## Recovery Validation Checklist
1. Health endpoint stable for at least 3 consecutive checks.
2. New Clerk signup creates/updates user record.
3. Stripe webhook updates plan for test customer.
4. Follow-up cron dry-run and live run complete without unbounded failure growth.
5. AI review and PDF export paths return success.
6. Latest backup archive is present and restorable in test flow.
