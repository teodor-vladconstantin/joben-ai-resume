-- Append-only proof of which version of the legal documents a user accepted,
-- and when (GDPR art. 7(1), art. 5(2)). users.tos_version keeps only the latest
-- acceptance; this table keeps the history. Service-role only: RLS on with no
-- policies (default-deny for anon/authenticated). Deleted with the account.
create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_clerk_id text not null,
  doc_version text not null,
  source text not null check (source in ('signup', 'reacceptance')),
  ip_hash text,
  accepted_at timestamptz not null default now()
);

create index if not exists idx_legal_acceptances_user
  on public.legal_acceptances(user_clerk_id, accepted_at desc);

alter table public.legal_acceptances enable row level security;
