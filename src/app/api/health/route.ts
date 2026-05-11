import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'
import { clientErrorMessage } from '@/lib/security/client-error'

export const runtime = 'nodejs'

// SECURITY: CLAUDE.md Medium #2 — the detailed checks map (which vendors
// are configured, which probes failed) is a recon gift to anyone scanning
// the site. Gate the verbose payload behind the existing admin allowlist
// and expose only a boolean status to anonymous callers.
function parseAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS || ''
  return new Set(
    raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
}

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
  try {
    const { userId } = await auth()
    const admins = parseAdminUserIds()
    const isAdmin = Boolean(userId && admins.has(userId))

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

    // SECURITY: admins get the detailed probe map; everyone else only sees
    // a boolean status + timestamp so no vendor configuration is disclosed.
    const publicPayload = {
      status,
      timestamp: payload.timestamp,
    }

    if (status === 'ok') {
      const body = isAdmin ? { success: true, data: payload, ...payload } : { success: true, ...publicPayload }
      return NextResponse.json(body, { status: 200 })
    }

    const body = isAdmin
      ? { success: false, error: 'Service degraded', data: payload, ...payload }
      : { success: false, error: 'Service degraded', ...publicPayload }
    return NextResponse.json(body, { status: 503 })
  } catch (error) {
    // SECURITY: never echo the underlying failure to the client.
    console.error('[api/health]', error)
    return NextResponse.json({ success: false, error: clientErrorMessage('server') }, { status: 500 })
  }
}
