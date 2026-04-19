const REQUIRED = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const PLACEHOLDER_VALUES = [
  'your_anthropic_api_key_here',
  'your_stripe_secret_key_here',
  'your_stripe_webhook_secret_here',
  'CHANGE_ME',
  'whsec_CHANGE_ME',
  'price_CHANGE_ME',
]

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\nSet them in .env.local before starting the app.`
    )
  }
}

export function isEnvSet(key: string): boolean {
  const val = process.env[key]
  if (!val) return false
  return !PLACEHOLDER_VALUES.some((p) => val.includes(p))
}

export const env = {
  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    secretKey: process.env.CLERK_SECRET_KEY!,
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    isConfigured: isEnvSet('ANTHROPIC_API_KEY'),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    proPriceId: process.env.STRIPE_PRO_PRICE_ID,
    isConfigured: isEnvSet('STRIPE_SECRET_KEY'),
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL ?? 'Joben <onboarding@resend.dev>',
  },
  cron: {
    secret: process.env.CRON_SECRET,
    isConfigured: isEnvSet('CRON_SECRET'),
  },
  latex: {
    serviceUrl: process.env.LATEX_SERVICE_URL ?? 'http://localhost:3005/api/compile',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
} as const
