-- Optional email capture for the anonymous ATS checker
-- (src/app/api/public/ats-check/route.ts). Only the email a visitor
-- volunteers and the resulting score are stored — never the resume content,
-- which is processed in memory and discarded. Mirrors signup_consents:
-- service-role only, no RLS policies (default-deny for anon/authenticated).
create table if not exists public.anonymous_scans (
  id uuid primary key default gen_random_uuid(),
  email text,
  overall_score integer,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_anonymous_scans_email
  on public.anonymous_scans(email)
  where email is not null;

alter table public.anonymous_scans enable row level security;
