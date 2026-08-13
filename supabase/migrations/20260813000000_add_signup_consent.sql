-- Server-side ToS/Privacy acceptance tracking tied to the user record (the
-- sign-up page's checkbox previously only wrote to sessionStorage, which is
-- unenforceable and trivially bypassable), plus a short-lived consent token
-- that lets us rate-limit signup *intent* by IP before Clerk creates the
-- account (the actual account-creation request goes straight from the
-- browser to Clerk's API and never touches our server).
alter table if exists public.users
  add column if not exists tos_accepted_at timestamptz,
  add column if not exists tos_version text,
  add column if not exists signup_ip_hash text;

create table if not exists public.signup_consents (
  token text primary key,
  ip_hash text not null,
  tos_version text not null,
  accepted_at timestamptz not null default now(),
  consumed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 minutes')
);

create index if not exists idx_signup_consents_expires_at
  on public.signup_consents(expires_at);

-- Service-role only (mirrors webhook_events / email_events): no policies
-- means default-deny for anon/authenticated roles.
alter table public.signup_consents enable row level security;
