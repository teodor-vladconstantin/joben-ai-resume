export const siteConfig = {
  name: "Joben",
  description: "Joben is the only free AI resume builder you'll ever need. Build ATS-optimized resumes and cover letters that pass the screen and get you the interview. Powered by advanced generative AI.",
  url: "https://joben.eu",
};

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
