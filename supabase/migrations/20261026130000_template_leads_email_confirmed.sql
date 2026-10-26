-- Double opt-in for the template-download marketing sequence
-- (src/app/api/cron/template-lead-sequence). A ticked checkbox only proves
-- someone typed the address, so the sequence starts once the inbox owner
-- confirms. Same approach as anonymous_scans.email_confirmed_at.
alter table public.template_leads
  add column if not exists email_confirmed_at timestamptz;

create index if not exists idx_template_leads_sequence
  on public.template_leads(email_confirmed_at)
  where marketing_consent and email_confirmed_at is not null;
