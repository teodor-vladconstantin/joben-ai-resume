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

function isLocalAppUrl(value: string | undefined): boolean {
  if (!value) return true

  try {
    const url = new URL(value)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  } catch {
    return value.includes('localhost') || value.includes('127.0.0.1')
  }
}

export function validateClerkLocalConfig() {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  const secretKey = process.env.CLERK_SECRET_KEY || ''
  const bypassGuard = process.env.ALLOW_CLERK_LIVE_ON_LOCALHOST === 'true'

  if (bypassGuard) {
    return
  }

  const isLocal = isLocalAppUrl(appUrl)
  const usesLiveKeys = publishableKey.startsWith('pk_live_') || secretKey.startsWith('sk_live_')

  if (isLocal && usesLiveKeys) {
    throw new Error(
      [
        'Clerk live keys detected with a localhost app URL.',
        'This is blocked by Clerk and causes browser origin errors.',
        'Use a Clerk development instance for local dev:',
        '  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... ',
        '  - CLERK_SECRET_KEY=sk_test_... ',
        'Or run the app on an allowed production domain/subdomain.',
      ].join('\n')
    )
  }
}

export function validateStripeLocalConfig() {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const secretKey = process.env.STRIPE_SECRET_KEY || ''
  const bypassGuard = process.env.ALLOW_STRIPE_LIVE_ON_LOCALHOST === 'true'

  if (bypassGuard) {
    return
  }

  const isLocal = isLocalAppUrl(appUrl)
  const usesLiveKey = secretKey.startsWith('sk_live_')

  if (isLocal && usesLiveKey) {
    throw new Error(
      [
        'A live Stripe secret key is set with a localhost app URL.',
        'This risks creating real charges against a live Stripe account from local dev.',
        'Use a Stripe test-mode key for local dev:',
        '  - STRIPE_SECRET_KEY=sk_test_... ',
        'Or run the app on an allowed production domain/subdomain.',
      ].join('\n')
    )
  }
}

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\nSet them in .env.local before starting the app.`
    )
  }

  validateClerkLocalConfig()
  validateStripeLocalConfig()
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
    recruitingPriceId: process.env.STRIPE_RECRUITING_PRICE_ID,
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
  upstash: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    // Not in REQUIRED — the system is designed to run with Redis absent in
    // dev (rate limiting/quotas fail open in that case, see RUNBOOK.md #5).
    isConfigured: isEnvSet('UPSTASH_REDIS_REST_URL') && isEnvSet('UPSTASH_REDIS_REST_TOKEN'),
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
} as const
