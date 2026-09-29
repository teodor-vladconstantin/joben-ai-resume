-- The visitor's PostHog browser distinct id, stored ONLY when they accepted
-- analytics cookies (the checker page sends it only then). Doubles as the
-- consent record for analytics about this scan:
--   * set  -> server-side events about the scan (report / 48h / 7d email sent,
--             post-scan email capture) are captured under this id, and the
--             Clerk webhook aliases it into the account that claims the scan;
--   * NULL -> no server-side PostHog event is linked to this scan at all.
alter table public.anonymous_scans
  add column if not exists posthog_distinct_id text;
