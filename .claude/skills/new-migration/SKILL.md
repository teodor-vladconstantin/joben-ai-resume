---
name: new-migration
description: Create a new Supabase migration safely (works around the Supabase CLI .env.local bug). Use when the user asks for a DB schema change.
disable-model-invocation: true
---
Argument: migration name in snake_case.

1. Rename `.env.local` aside: `mv .env.local .env.local.bak` (the Supabase CLI chokes on it).
2. Run `npx supabase migration new <name>`. Never pass `--debug` (it leaks secrets).
3. Restore: `mv .env.local.bak .env.local`, even if step 2 failed.
4. Write the SQL in the new file only. Never edit committed migrations or the Supabase dashboard.
5. Checklist: RLS enabled on new tables, idempotent statements, safe backfill, index for lookup columns.
6. Run the `migration-reviewer` agent on it. Do not run `supabase db push` unless the user asks.
