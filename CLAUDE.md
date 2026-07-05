@AGENTS.md


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Project Overview
joben-resume — Next.js 14 AI resume builder SaaS. Stack: Next.js App Router, TypeScript, Supabase (DB + RLS), Clerk (auth + webhook sync), Anthropic Claude API, Stripe, Resend, Upstash, Tailwind, shadcn/ui.

Commands
bashnpm run dev
npm run build
npm run lint
npx tsc --noEmit

npx supabase start
npx supabase db push
npx supabase migration new <name>

Architecture
Auth

middleware.ts enforces protected routes via Clerk
Server: auth() from @clerk/nextjs/server; Client: useUser() / useAuth()
Clerk users synced to Supabase via webhook at /api/webhooks/clerk

Database

Supabase Postgres, RLS enabled, migrations in supabase/migrations/
Resume data = JSONB blob (full resume loaded/saved as unit — not relational)
Never edit schema in dashboard; always use supabase migration new

Key files

lib/env.ts — env validation; app won't start without required keys
lib/clerk-appearance.ts — shared Clerk dark theme
lib/resend.ts, lib/upstash.ts — email + rate limiting

Structure
src/app/           App Router pages + API routes
src/components/    Shared components
src/lib/           Utilities and service clients
supabase/migrations/  SQL migrations

Required Env Vars
See .env.prod.example. Critical ones:

SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_WEBHOOK_SECRET
ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID
RESEND_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN


Code Style

TypeScript strict — no any
App Router only, Server Actions over API routes where possible
Tailwind + shadcn/ui only
async/await only
Imports: React → Next → third-party → local (@/)


Critical Rules

NEVER commit .env.local or secrets
NEVER use Supabase service role key client-side
After significant changes: npx tsc --noEmit then npm run lint
DB changes: always create migration file, never edit in Supabase dashboard


Working Methodology — IMPORTANT
State tracking
TODO.md in project root is the single source of truth. Update it before and after every task.
Format:
markdown## Active
- [IN PROGRESS] Short description

## Done
- [DONE] Task name

## Backlog
- [ ] Task name
Before starting work

Read TODO.md
Mark the task [IN PROGRESS]
For tasks touching 3+ files: use Plan Mode (Shift+Tab) first

During work

Grep before Read — search for symbols before opening full files
Read before Edit — always read a file before modifying it
Parallel reads — fire multiple Read calls simultaneously for exploration
Prefer Edit over Write — modify existing files, don't recreate them
After each task: npx tsc --noEmit + npm run lint + mark [DONE] in TODO.md

Sub-agents (Task tool) — use when

Exploring codebase-wide patterns ("find all usages of X")
Parallel independent work (e.g., 3 unrelated loading.tsx files)
Deep isolated research that would bloat main context

Do NOT use sub-agents for simple single-file edits.
Context management

/compact at ~50% context fill — don't wait for 70%
/clear when switching to a fully unrelated task
TODO.md must always be accurate so context can be reconstructed instantly


Deployment Target
VPS (Docker Compose)
├── traefik         reverse proxy + TLS
├── next-app        Next.js standalone
├── latex-service   PDF generation
└── supabase        self-hosted stack
Config: docker-compose.prod.yml, CI/CD: .github/workflows/deploy.yml

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships. graphify-out/graph.json exists in this repo.

MANDATORY rules (not optional guidance — a PreToolUse hook in .claude/settings.json already enforces this at the tool level for Bash grep/rg/find and for Read/Glob on source files, injecting a reminder if you skip it):
- Before grepping, reading, or exploring source files for a codebase question, you MUST first run `graphify query "<question>"` (or `graphify path "<A>" "<B>"` for relationships, `graphify explain "<concept>"` for a focused concept). These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output. Only fall back to raw grep/Read after graphify has oriented you, or when modifying/debugging specific lines you already located.
- This rule applies to subagents too — include it explicitly in every subagent prompt that involves code exploration, since subagents don't inherit this file's hooks/instructions automatically.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.

Keeping the graph current is automatic: a PostToolUse hook in .claude/settings.json runs `graphify update .` (AST-only, no API cost) after every Edit/MultiEdit/Write. You do not need to remember to run this yourself — it fires unconditionally after any file change in this repo.
