-- Email gate on the free CV template downloads (src/app/api/public/template-lead).
-- One row per address. terms_accepted_at is always set (the gate requires it);
-- marketing_consent is a separate, optional opt-in and is never inferred from
-- the terms box. consent_version names the legal copy shown at the time.
-- Service-role only, no RLS policies (default-deny for anon/authenticated),
-- same as anonymous_scans.
create table if not exists public.template_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  template_id text not null,
  locale text not null,
  terms_accepted_at timestamptz not null default now(),
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  consent_version text not null,
  posthog_distinct_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_template_leads_marketing
  on public.template_leads(created_at)
  where marketing_consent;

alter table public.template_leads enable row level security;
