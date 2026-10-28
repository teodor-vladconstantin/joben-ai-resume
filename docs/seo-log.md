# SEO log

Weekly snapshot. Add a new dated section on top of "Weekly entries"; never edit past rows.
Sources: GSC (`sc-domain:joben.eu`, Web, last 28 days unless noted), GA4 property "Joben", PostHog (server events = true volume).

## Baseline: 2026-10-28 (SEO started 2026-10-16)

### Search Console (2026-09-29 to 2026-10-26)
- Clicks 25, impressions ~1,730. Impressions/day: 27 (16 Oct) to 204 (26 Oct).
- Countries: Romania 691 impr / 12 clicks; US 167, UK 100, Italy 70, Germany 67 (0-1 clicks each).
- Devices: desktop 999 impr (avg pos 21), mobile 728 (avg pos 13).
- Brand "joben": 509-517 impr, 3 clicks, pos 6.1 (CTR 0.6%).
- Indexing: 115 indexed, 58 not indexed: 404 (23), crawled not indexed (19), redirect (6), alternate with canonical (6), noindex (1), 403 (1), duplicate no canonical (1), robots.txt (1). No validation started.

| Page | Clicks | Impr | Pos |
|---|---|---|---|
| joben.eu/ (now 301 to /ro) | 9 | 597 | 5.8 |
| www.joben.eu/free-ats-checker (now 301 to /ro/verificare-cv-ats) | 8 | 71 | 8.6 |
| /ro/ghiduri/structura-scrisorii-de-intentie | 3 | 52 | 23.4 |
| /ro/free-ats-checker (now 301 to /ro/verificare-cv-ats) | 2 | 36 | 7.0 |
| /en/cv-templates | 0 | 170 | 6.0 |
| /en/glossary/functional-resume | 0 | 136 | 18.1 |
| /en/guides/resume-after-a-career-gap (impressions are off-topic "resume near" queries) | 0 | 92 | 5.4 |
| /ro/ghiduri/cv-citit-corect-de-ats | 0 | 22 | 5.9 |
| /ro/pricing | 0 | 11 | 5.8 |

### GA4 (2026-10-16 to 2026-10-28)
- 20 sessions, 16 users, organic search 1 session, revenue 0.
- Events: ats_scan_completed 3, pricing_viewed 3, begin_checkout 2, sign_up_started 2, cta_click 1, plan_cta_click 1, sign_up 1, purchase 0.
- Known undercount: GTM loads only after cookie Accept (basic consent mode, by design) and, until the 2026-10-28 fix, Accept did not grant analytics on the landing page. GA4 is not a reliable acquisition source at this volume.

### PostHog, same window (true funnel volume)
- ATS scans (server) 19, sign-ups (server) 6, sessions with pageviews ~101, Google organic sessions 6 (browser, consented only).

## Weekly entries

Copy this block each week (first check: 2026-11-11, second: 2026-11-25; judge positions only from 2026-11-25).

```
### YYYY-MM-DD
- GSC 28d: clicks _, impressions _, avg position _
- Indexed _ / not indexed _ (404 _, crawled not indexed _)
- Key pages (clicks / impr / pos): /ro _, /ro/verificare-cv-ats _, /en/free-ats-checker _, /en/cv-templates _, /en/glossary/functional-resume _, /ro/ghiduri/structura-scrisorii-de-intentie _
- GA4 organic sessions _
- PostHog server: ats_scan_completed _, sign_up _, begin_checkout _, purchase _
- Changes shipped this week:
```
