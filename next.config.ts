import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next'

const REQUIRED_ENV = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:')
  missing.forEach((k) => console.error(`   - ${k}`))
  console.error('Set them in .env.local before starting.\n')
  process.exit(1)
}

// SECURITY: CLAUDE.md Critical #5 — every response gets a hardened header
// set. CSP allows Clerk, Supabase, PostHog (rewritten via /ingest), Sentry
// tunnel (/monitoring), and Stripe. We keep `'unsafe-inline'` on script-src
// because Next.js + Clerk bootstrap require inline scripts; tighten to
// nonces in a future iteration if/when we drop those vendors.
//
// Clerk supports a CNAME proxy (e.g. `clerk.joben.eu`) that does NOT match
// the default `*.clerk.com` / `*.clerk.accounts.dev` wildcards. Production
// uses such a proxy, so we read it from env so any future re-host only
// needs a Vercel env update — no code change.
const CLERK_PROXY_DOMAIN =
  process.env.NEXT_PUBLIC_CLERK_PROXY_URL ||
  process.env.NEXT_PUBLIC_CLERK_FRONTEND_API ||
  'https://clerk.joben.eu'
const CLERK_PROXY_HOST = (() => {
  try {
    const u = new URL(CLERK_PROXY_DOMAIN)
    return `${u.protocol}//${u.host}`
  } catch {
    return 'https://clerk.joben.eu'
  }
})()

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.stripe.com")' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob:",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
      [
        'script-src',
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://*.clerk.com',
        'https://*.clerk.accounts.dev',
        CLERK_PROXY_HOST,
        'https://challenges.cloudflare.com',
        'https://js.stripe.com',
        'https://www.googletagmanager.com',
      ].join(' '),
      [
        'script-src-elem',
        "'self'",
        "'unsafe-inline'",
        'https://*.clerk.com',
        'https://*.clerk.accounts.dev',
        CLERK_PROXY_HOST,
        'https://challenges.cloudflare.com',
        'https://js.stripe.com',
        'https://www.googletagmanager.com',
      ].join(' '),
      [
        'connect-src',
        "'self'",
        'https://*.clerk.com',
        'https://*.clerk.accounts.dev',
        CLERK_PROXY_HOST,
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://eu.i.posthog.com',
        'https://eu-assets.i.posthog.com',
        'https://*.ingest.sentry.io',
        'https://api.stripe.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'https://*.google-analytics.com',
        'https://*.analytics.google.com',
      ].join(' '),
      [
        'frame-src',
        "'self'",
        'https://*.clerk.com',
        CLERK_PROXY_HOST,
        'https://challenges.cloudflare.com',
        'https://js.stripe.com',
        'https://hooks.stripe.com',
      ].join(' '),
      'upgrade-insecure-requests',
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://eu.i.posthog.com/decide',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "joben",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
