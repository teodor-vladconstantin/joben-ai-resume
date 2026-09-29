-- Page locale ('ro' | 'en') the anonymous ATS scan was run from
-- (src/app/api/public/ats-check/route.ts). The report email and the 48h/7d
-- follow-ups are sent in this language. Existing rows stay NULL and are
-- treated as 'ro' (the site's default locale) by toAnonScanEmailLocale().
alter table public.anonymous_scans
  add column if not exists locale text;

alter table public.anonymous_scans
  drop constraint if exists anonymous_scans_locale_check;

alter table public.anonymous_scans
  add constraint anonymous_scans_locale_check
  check (locale is null or locale in ('ro', 'en'));
