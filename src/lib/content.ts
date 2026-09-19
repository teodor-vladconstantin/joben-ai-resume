export const siteConfig = {
  name: "Joben",
  description: "Joben is the only free AI resume builder you'll ever need. Build ATS-optimized resumes and cover letters that pass the screen and get you the interview. Powered by advanced generative AI.",
  url: "https://joben.eu",
};

// Evaluated once per build (this is a module-level constant in code that
// only runs at build time for the statically-generated marketing pages), so
// it doubles as a "last deployed" timestamp for JSON-LD dateModified without
// needing a CMS or a database write on every deploy.
export const BUILD_TIME = new Date().toISOString();

// Non-text plan behavior, kept locale-independent. Merge by array index with
// the translated `Pricing.plans` array from messages/{locale}.json, which
// holds the same 3 plans (Free, Pro, Recruiting) in the same order.
export const pricingPlanMeta: {
  planId: 'pro' | 'recruiting' | undefined
  isPrimary: boolean
  isBestValue: boolean
}[] = [
  { planId: undefined, isPrimary: false, isBestValue: false },
  { planId: 'pro', isPrimary: true, isBestValue: false },
  { planId: 'recruiting', isPrimary: false, isBestValue: true },
]
