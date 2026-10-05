-- Double opt-in for the anonymous ATS checker: the address typed into the
-- form is only mailed a confirmation link (no report, no nurture) until its
-- owner clicks it. Nurture crons require email_confirmed_at, so nobody can
-- enroll a third party's address. Existing rows stay NULL (not confirmed).
alter table public.anonymous_scans
  add column if not exists email_confirmed_at timestamptz;
