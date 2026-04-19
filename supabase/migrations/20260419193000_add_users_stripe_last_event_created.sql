alter table public.users
  add column if not exists stripe_last_event_created bigint not null default 0;

create index if not exists idx_users_stripe_customer_id
  on public.users(stripe_customer_id);

create index if not exists idx_users_stripe_last_event_created
  on public.users(stripe_last_event_created desc);