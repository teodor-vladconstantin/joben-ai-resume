alter table public.users
  add column if not exists lifetime_recruiting_unlocked boolean not null default false,
  add column if not exists lifetime_recruiting_unlocked_at timestamptz,
  add column if not exists lifetime_recruiting_code text;

create index if not exists idx_users_lifetime_recruiting_unlocked
  on public.users(lifetime_recruiting_unlocked)
  where lifetime_recruiting_unlocked = true;
