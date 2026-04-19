# Joben Resume

Joben Resume is an AI-assisted resume builder SaaS built with Next.js App Router, TypeScript, Supabase, Clerk, Stripe, Resend, Upstash, and Anthropic.

## Core Features
- Resume builder with ATS-focused scoring
- AI review and bullet improvement workflows
- Cover letter generation and PDF export
- Subscription upgrades (Stripe)
- Automated welcome and follow-up emails
- Operational observability via health endpoint, webhook idempotency, and email/event tracking

## Local Development Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment variables
Create `.env.local` and define all required values:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`
- `LATEX_SERVICE_URL` (optional; defaults to `http://localhost:3005/api/compile`)

### 3) Start Supabase locally
```bash
npx supabase start
npx supabase db push
```

Notes:
- Keep DB schema changes in `supabase/migrations/` only.
- Do not edit schema directly in Supabase dashboard.

### 4) Start app services
```bash
npm run dev
```

Optional local PDF service (if needed outside Docker compose):
```bash
cd latex-service
npm install
npm run dev
```

## Quality Gates (Before Push)
```bash
npx tsc --noEmit
npm run lint
npm run test
npm run build
```

## Runtime Endpoints

### Healthcheck
- Endpoint: `/api/health`
- `200` + `status=ok`: integrations and DB probe are healthy
- `503` + `status=degraded`: missing critical integration config or failed DB probe

### Follow-up Cron
- Endpoint: `/api/cron/followup-7d`
- Auth:
	- `Authorization: Bearer <CRON_SECRET>`
	- `x-cron-secret: <CRON_SECRET>`
- Query params:
	- `dryRun=true|false`
	- `limit=1..500`
	- `retries=0..3`

Examples:
```bash
curl -X POST "https://your-domain.com/api/cron/followup-7d?dryRun=true&limit=25" -H "Authorization: Bearer <CRON_SECRET>"
curl -X POST "https://your-domain.com/api/cron/followup-7d?limit=100&retries=1" -H "Authorization: Bearer <CRON_SECRET>"
```

### Stripe Billing
- Checkout: `/api/billing/checkout`
- Webhook: `/api/webhooks/stripe`
- Requires valid `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`

## Observability Data
- `public.webhook_events`: idempotency claims for Clerk/Stripe webhook events
- `public.email_events`: welcome/followup send outcomes and dedup keys (`source_event_id`)
- `public.product_events`: product funnel instrumentation (`resume_created -> ... -> checkout_started`)

## Troubleshooting

### Stripe checkout returns config error
- Verify `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID` are set.
- Verify `NEXT_PUBLIC_APP_URL` points to current environment URL.

### Stripe webhook signature errors
- Verify `STRIPE_WEBHOOK_SECRET` matches webhook endpoint secret.
- Ensure raw request body is forwarded unchanged by proxies.

### Clerk webhook sync failures
- Verify `CLERK_WEBHOOK_SECRET` is configured.
- Replay event and confirm dedup rows in `webhook_events`.

### Email sends fail or duplicate
- Check `email_events.status`, `error`, and `source_event_id`.
- Confirm Resend credentials and sender identity are valid.
- Review cron runs in dry-run first when diagnosing follow-up behavior.

### AI endpoints blocked by rate limits
- Confirm Upstash env vars are set.
- Free users are limited; upgrade path should show `showUpgrade` response.

### Supabase relation missing errors
- Run pending migrations (`npx supabase db push`).
- Confirm local stack is running (`npx supabase start`).

## Operational Guide
For deployment, incident response, and rollback procedures, see `RUNBOOK.md`.
