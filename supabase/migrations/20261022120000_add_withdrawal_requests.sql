-- Right-of-withdrawal declarations submitted through /withdrawal (Directive
-- 2011/83/EU art. 11a, GEO 34/2014). Kept as proof of when the consumer
-- declared the withdrawal, so rows are not covered by the retention sweep.
-- Service-role only: RLS on with no policies (default-deny for anon/authenticated).
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  contract_ref text,
  user_clerk_id text,
  locale text not null default 'ro',
  ip_hash text,
  ack_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_withdrawal_requests_email
  on public.withdrawal_requests(email);

alter table public.withdrawal_requests enable row level security;
