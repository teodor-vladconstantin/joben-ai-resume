-- Older template leads (captured before TEMPLATE_24H_LAUNCH_AT) that match the
-- 24h email rules. Read-only, totals only. Run in the Supabase SQL Editor.
-- The route's dry run returns the same counts (backlog.*) once deployed.
with f as (
  select
    exists(select 1 from public.users u where lower(u.email) = o.email) as has_account,
    exists(select 1 from public.anonymous_scans s where lower(s.email) = o.email
           or (o.posthog_distinct_id is not null and s.posthog_distinct_id = o.posthog_distinct_id)) as scanned,
    exists(select 1 from public.email_suppressions x where lower(x.email) = o.email) as suppressed,
    exists(select 1 from public.email_events e where lower(e.email) = o.email and e.email_type like 'template%'
           and e.status in ('processing', 'sent', 'suppressed')) as emailed
  from public.template_leads o
  where o.marketing_consent and o.created_at < '2026-11-28T00:00:00Z'
)
select
  (select count(*) from public.template_leads) as all_leads,
  count(*) as consented,
  count(*) filter (where has_account) as with_account,
  count(*) filter (where not has_account and scanned) as scanned,
  count(*) filter (where not has_account and not scanned and suppressed) as unsubscribed,
  count(*) filter (where not has_account and not scanned and not suppressed) as eligible,
  count(*) filter (where not has_account and not scanned and not suppressed and not emailed) as eligible_never_emailed
from f;
