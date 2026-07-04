/**
 * Shared boilerplate for the marketing/lifecycle email cron routes
 * (e.g. followup-7d, inactivity-3d). Only the pieces that are byte-for-byte
 * identical across those routes live here — user-selection/filter logic
 * stays in each route because the cohorts and eligibility rules differ.
 */

export type CronCandidateUser = {
  clerk_id: string
  email: string | null
  first_name: string | null
}

export type CronOptions = {
  dryRun: boolean
  limit: number
  maxRetries: number
}

/**
 * Parses the shared `dryRun` / `limit` / `retries` query params used by the
 * lifecycle email cron routes. Identical across followup-7d and inactivity-3d.
 */
export function parseCronOptions(request: Request): CronOptions {
  const url = new URL(request.url)
  const dryRunParam = url.searchParams.get('dryRun')
  const limitParam = Number(url.searchParams.get('limit') || '100')
  const retriesParam = Number(url.searchParams.get('retries') || '1')

  return {
    dryRun: dryRunParam === '1' || dryRunParam === 'true',
    limit: Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 100,
    maxRetries: Number.isFinite(retriesParam) ? Math.min(Math.max(retriesParam, 0), 3) : 1,
  }
}

/**
 * Validates the cron secret sent via `Authorization: Bearer <secret>` or the
 * `x-cron-secret` header. Identical across all cron routes that authenticate
 * this way.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const authHeader = request.headers.get('authorization') || ''
  const tokenFromBearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const tokenFromHeader = request.headers.get('x-cron-secret') || ''

  return tokenFromBearer === cronSecret || tokenFromHeader === cronSecret
}

/** Postgres unique-violation code, used to detect an already-claimed email_events lock row. */
export function isDuplicateKeyError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

export type SendEmailResult = {
  success: boolean
  error?: string
  providerId?: string
}

export type SendWithRetryResult =
  | { success: true; attempts: number; providerId?: string }
  | { success: false; attempts: number; error: string }

/**
 * Retries a single email send up to `maxRetries` additional times. The send
 * function itself (which template/provider call to make) is supplied by the
 * caller since that's the one thing that differs between cron routes.
 */
export async function sendEmailWithRetry(
  sendFn: (input: { to: string; firstName: string | null }) => Promise<SendEmailResult>,
  input: { to: string; firstName: string | null; maxRetries: number }
): Promise<SendWithRetryResult> {
  let lastError = ''

  for (let attempt = 0; attempt <= input.maxRetries; attempt += 1) {
    const result = await sendFn({ to: input.to, firstName: input.firstName })

    if (result.success) {
      return {
        success: true,
        attempts: attempt + 1,
        providerId: result.providerId,
      }
    }

    lastError = result.error || 'Send failed'
  }

  return {
    success: false,
    attempts: input.maxRetries + 1,
    error: lastError,
  }
}
