-- One row per (legal version, user) that has been emailed about a change to the
-- Terms / Privacy / Cookie Policy (api/cron/legal-change-notice). Makes the
-- notice idempotent: a user is emailed at most once per version.
-- Service-role only: RLS on with no policies. Deleted with the account.
create table if not exists public.legal_notice_deliveries (
  version text not null,
  user_clerk_id text not null,
  sent_at timestamptz not null default now(),
  primary key (version, user_clerk_id)
);

create index if not exists idx_legal_notice_deliveries_user
  on public.legal_notice_deliveries(user_clerk_id);

alter table public.legal_notice_deliveries enable row level security;
