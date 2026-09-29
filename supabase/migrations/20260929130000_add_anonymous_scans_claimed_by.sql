-- Links an anonymous ATS scan to the account created from it. Set once by
-- the Clerk webhook (user.created): by the scan id carried through sign-up
-- (Clerk unsafeMetadata atsScanId), or else by the newest unclaimed scan
-- with the same verified email. The dashboard reads the latest claimed scan
-- to show "Your last ATS score"; the 48h/7d nurture crons skip claimed scans.
-- Holds a Clerk user id (users.clerk_id), same as other *_clerk_id columns.
alter table public.anonymous_scans
  add column if not exists claimed_by text,
  add column if not exists claimed_at timestamptz;

create index if not exists idx_anonymous_scans_claimed_by
  on public.anonymous_scans(claimed_by, created_at desc)
  where claimed_by is not null;
