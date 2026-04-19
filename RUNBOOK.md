# Joben Resume Runbook

## Purpose
This runbook defines routine operations, incident response, and rollback procedures for Joben Resume production.

## System Topology
- `next-app`: main Next.js application
- `latex-service`: PDF compile microservice
- `supabase`: Postgres + APIs
- `traefik`: reverse proxy/TLS

## Critical Endpoints
- Health: `/api/health`
- Clerk webhook: `/api/webhooks/clerk`
- Stripe webhook: `/api/webhooks/stripe`
- Follow-up cron: `/api/cron/followup-7d`
- Stripe checkout: `/api/billing/checkout`

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
3. If Redis is unavailable, APIs should fail closed with 503; do not bypass this behavior in production.
4. Restore Redis connectivity before reopening traffic.

### 6) Checkout failures for Pro upgrades
1. Verify `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID`.
2. Verify app URL and allowed return URLs.
3. Test `/api/billing/checkout` manually under authenticated user.
4. Inspect product funnel event `checkout_started` for request-level visibility.

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
