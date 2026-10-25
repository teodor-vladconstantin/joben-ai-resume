alter table public.users
  add column if not exists onboarding jsonb not null default '{}'::jsonb;

-- Everyone who exists today skips automatic tours; they can start any tour
-- from the "?" button. Only accounts created after this runs get them.
update public.users
set onboarding = '{"legacy": true}'::jsonb
where onboarding = '{}'::jsonb;
