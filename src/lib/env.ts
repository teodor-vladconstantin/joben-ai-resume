const REQUIRED = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
] as const

const PLACEHOLDER_VALUES = [
  'your_anthropic_api_key_here',
  'your_gemini_api_key',
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

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\nSet them in .env.local before starting the app.`
    )
  }

  validateClerkLocalConfig()
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
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    isConfigured: isEnvSet('GEMINI_API_KEY'),
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
