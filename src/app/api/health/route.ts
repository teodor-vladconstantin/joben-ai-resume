import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'

type ServiceProbe = 'ok' | 'error' | 'skipped'

type HealthPayload = {
  status: 'ok' | 'degraded'
  timestamp: string
  checks: {
    database: 'ok' | 'error'
    resendConfigured: boolean
    stripeConfigured: boolean
    cronConfigured: boolean
    rateLimitBackend: ServiceProbe
    latexService: ServiceProbe
    latexServiceAuthConfigured: boolean
  }
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout)
        reject(new Error('Timed out'))
      }, timeoutMs)
    }),
  ])
}

function resolveLatexHealthUrl(): string | null {
  const configured = process.env.LATEX_SERVICE_HEALTH_URL
  if (configured) return configured

  const compileUrl = process.env.LATEX_SERVICE_URL
  if (!compileUrl) return null

  if (compileUrl.includes('/api/compile')) {
    return compileUrl.replace(/\/api\/compile\/?$/, '/health')
  }

  return `${compileUrl.replace(/\/$/, '')}/health`
}

export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production'
  const supabase = createServerClient()

  let database: 'ok' | 'error' = 'ok'
  const dbProbe = await supabase.from('users').select('clerk_id').limit(1)
  if (dbProbe.error) {
    database = 'error'
  }

  const resendConfigured = Boolean(process.env.RESEND_API_KEY)
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID)
  const cronConfigured = Boolean(process.env.CRON_SECRET)
  const requireLatexServiceAuth = process.env.LATEX_SERVICE_AUTH_REQUIRED === 'true'
  const latexServiceAuthConfigured = !requireLatexServiceAuth || Boolean(process.env.LATEX_SERVICE_SECRET)

  let rateLimitBackend: ServiceProbe = 'skipped'
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })

      await withTimeout(redis.ping(), 2500)
      rateLimitBackend = 'ok'
    } catch {
      rateLimitBackend = 'error'
    }
  }

  let latexService: ServiceProbe = 'skipped'
  const latexHealthUrl = resolveLatexHealthUrl()
  if (latexHealthUrl) {
    try {
      const headers: Record<string, string> = {}
      if (process.env.LATEX_SERVICE_SECRET) {
        headers.Authorization = `Bearer ${process.env.LATEX_SERVICE_SECRET}`
      }

      const response = await withTimeout(fetch(latexHealthUrl, { headers, cache: 'no-store' }), 3000)
      latexService = response.ok ? 'ok' : 'error'
    } catch {
      latexService = 'error'
    }
  }

  const status: HealthPayload['status'] =
    (isProduction ? rateLimitBackend === 'ok' : rateLimitBackend !== 'error') &&
    (isProduction ? latexService === 'ok' : latexService !== 'error') &&
    database === 'ok' &&
    resendConfigured &&
    stripeConfigured &&
    cronConfigured &&
    latexServiceAuthConfigured
      ? 'ok'
      : 'degraded'

  const payload: HealthPayload = {
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database,
      resendConfigured,
      stripeConfigured,
      cronConfigured,
      rateLimitBackend,
      latexService,
      latexServiceAuthConfigured,
    },
  }

  return NextResponse.json(payload, { status: status === 'ok' ? 200 : 503 })
}
