export { company } from "@/lib/legal/company";

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

// 14-day pass price in cents ($8.00 USD). Used for the Stripe price_data
// fallback; tests/lib/pass-price.test.ts keeps the "$8" copy in sync.
export const PASS_14D_PRICE_CENTS = 800

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
