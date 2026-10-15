export const siteConfig = {
  name: "Joben",
  description: "Joben is the only free AI resume builder you'll ever need. Build ATS-optimized resumes and cover letters that pass the screen and get you the interview. Powered by advanced generative AI.",
  url: "https://joben.eu",
};

// Legal entity operating Joben. Single source for the identification details
// Romanian law requires on the site (Legea 365/2002 art. 5, GDPR art. 13).
// The company is not registered for VAT, so the CUI carries no "RO" prefix.
export const company = {
  legalName: "TETA ABC SRL",
  cui: "22404824",
  regCom: "J2007001135104",
  address: "Str. Centrală nr. 169, sat Mărăcineni, jud. Buzău, cod poștal 127325, România",
  email: "hello@joben.eu",
};

// Evaluated once per build (this is a module-level constant in code that
// only runs at build time for the statically-generated marketing pages), so
// it doubles as a "last deployed" timestamp for JSON-LD dateModified without
// needing a CMS or a database write on every deploy.
export const BUILD_TIME = new Date().toISOString();

// 14-day pass price in bani (39.00 RON). Used for the Stripe price_data
// fallback; tests/lib/pass-price.test.ts keeps the "39 RON" copy in sync.
export const PASS_14D_PRICE_BANI = 3900

// Non-text plan behavior, kept locale-independent. Merge by array index with
// the translated `Pricing.plans` array from messages/{locale}.json, which
// holds the same 4 plans (Free, Pass 14 days, Pro, Recruiting) in the same
// order. Badges are translated copy, so they live in messages (plan.badge).
export const pricingPlanMeta: {
  planId: 'pro' | 'recruiting' | 'pass_14d' | undefined
  isPrimary: boolean
}[] = [
  { planId: undefined, isPrimary: false },
  { planId: 'pass_14d', isPrimary: false },
  { planId: 'pro', isPrimary: true },
  { planId: 'recruiting', isPrimary: false },
]
