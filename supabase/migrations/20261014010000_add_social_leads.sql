-- Migration: Add social_leads table for Social Listening system
-- Date: 2026-10-14

create table if not exists public.social_leads (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  platform_url text not null,
  author text,
  title text not null,
  body text,
  matched_keywords text[] not null default '{}',
  relevance_score integer default 0,
  suggested_response text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_social_leads_source on public.social_leads(source);
create index if not exists idx_social_leads_created_at on public.social_leads(created_at);

-- RLS on with no policies: only the service role (which bypasses RLS) can
-- read or write leads.
alter table public.social_leads enable row level security;
