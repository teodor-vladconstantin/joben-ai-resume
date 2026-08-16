-- Persists the full scored report (overall_score, grade, categories, issues)
-- for every anonymous ATS scan, not just ones where the visitor gave an
-- email up front. This lets a visitor come back after seeing their score and
-- submit an email later (POST /api/public/ats-check/email) to get the exact
-- same report sent to them, without the client having to resend (and us
-- having to trust) the report content itself.
alter table public.anonymous_scans
  add column if not exists report_json jsonb;
