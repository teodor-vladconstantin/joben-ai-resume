import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { sendRateLimitEmailIfEligible } from '@/lib/email-automation'
import { clientErrorMessage } from '@/lib/security/client-error'
import {
  bumpCounter,
  checkRouteRateLimit,
  isLocked,
  resolveRateLimitIdentity,
  setLock,
} from '@/lib/security/route-rate-limit'
import { redeemCodeSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

const LIFETIME_RECRUITING_CODE_ID = 'private_recruiting_lifetime_code'
const REDEEM_CODE_ENV_KEYS = [
  'RECRUITING_LIFETIME_CODE',
  'LIFETIME_RECRUITING_CODE',
  'REDEEM_ACCESS_CODE',
  'REDEEM_CODE',
] as const

const PLACEHOLDER_CODE_VALUES = [
  'CHANGE_ME',
  'CHANGE_ME_PRIVATE_REDEEM_CODE',
  'YOUR_PRIVATE_REDEEM_CODE',
] as const

// SECURITY: CLAUDE.md Critical #4 — burst protection + lockout against
// brute-force redemption.
const REDEEM_RATE_LIMIT_PER_HOUR = 5
const REDEEM_LOCKOUT_THRESHOLD = 10
const REDEEM_LOCKOUT_TTL_SECONDS = 24 * 60 * 60
const REDEEM_FAIL_COUNTER_TTL_SECONDS = 24 * 60 * 60

function normalizeCode(input: string | null | undefined): string {
  return (input || '').trim().toUpperCase()
}

// SECURITY: constant-time string compare so the response timing does not
// leak how many leading characters of the expected code matched.
function safeStringEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8')
  const bufferB = Buffer.from(b, 'utf8')
  if (bufferA.length !== bufferB.length) {
    // Compare against itself to keep timing roughly constant even on
    // length mismatch.
    timingSafeEqual(bufferA, bufferA)
    return false
  }
  return timingSafeEqual(bufferA, bufferB)
}

function lockKey(userId: string): string {
  return `redeem-lock:${userId}`
}

function failKey(userId: string): string {
  return `redeem-fail:${userId}`
}

function resolveExpectedCode(): { code: string | null; sourceKey: string | null } {
  for (const key of REDEEM_CODE_ENV_KEYS) {
    const normalized = normalizeCode(process.env[key])
    if (!normalized) continue

    const isPlaceholder = PLACEHOLDER_CODE_VALUES.some((placeholder) => normalized.includes(placeholder))
    if (isPlaceholder) continue

    return { code: normalized, sourceKey: key }
  }

  return { code: null, sourceKey: null }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()

    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    // SECURITY: respect any standing 24h lockout from previous brute-force.
    if (await isLocked(lockKey(userId))) {
      logger.warn('Redeem code attempted while locked', {
        requestId,
        route: '/api/billing/redeem-code',
        userId,
      })
      await sendRateLimitEmailIfEligible({
        userId,
        requestId,
        route: '/api/billing/redeem-code',
        reason: 'lockout',
      })
      return jsonWithRequestId(
        { error: clientErrorMessage('rate_limit', 'Too many invalid attempts. Try again in 24 hours.') },
        429,
        requestId
      )
    }

    // SECURITY: short-window burst protection (5/hour/user).
    const limit = await checkRouteRateLimit({
      name: 'redeem-code',
      identifier: resolveRateLimitIdentity(req, userId),
      limit: REDEEM_RATE_LIMIT_PER_HOUR,
      windowSeconds: 3600,
    })
    if (!limit.ok) {
      logger.warn('Redeem code rate-limit hit', {
        requestId,
        route: '/api/billing/redeem-code',
        userId,
        retryAfter: limit.retryAfter,
      })
      await sendRateLimitEmailIfEligible({
        userId,
        requestId,
        route: '/api/billing/redeem-code',
        reason: 'route_rate_limit',
      })
      return new Response(
        JSON.stringify({ error: clientErrorMessage('rate_limit') }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(limit.retryAfter),
            'x-request-id': requestId,
          },
        }
      )
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = redeemCodeSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const submittedCode = normalizeCode(parsed.data.code)
    if (!submittedCode) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const { code: expectedCode, sourceKey } = resolveExpectedCode()
    if (!expectedCode) {
      logger.error('Redeem code config missing', {
        requestId,
        route: '/api/billing/redeem-code',
        userId,
        checkedEnvKeys: REDEEM_CODE_ENV_KEYS,
      })
      // SECURITY: keep the status 500 (server misconfig) but strip the env
      // key names from the client-facing message to avoid info disclosure.
      return jsonWithRequestId(
        { error: clientErrorMessage('server', 'Redeem is temporarily unavailable.') },
        500,
        requestId
      )
    }

    if (!safeStringEqual(submittedCode, expectedCode)) {
      // SECURITY: bump per-user fail counter; lock for 24h once threshold hit.
      const fails = await bumpCounter(failKey(userId), REDEEM_FAIL_COUNTER_TTL_SECONDS)
      if (fails >= REDEEM_LOCKOUT_THRESHOLD) {
        await setLock(lockKey(userId), REDEEM_LOCKOUT_TTL_SECONDS)
        logger.warn('Redeem code user locked after repeated failures', {
          requestId,
          route: '/api/billing/redeem-code',
          userId,
          fails,
        })
      }
      return jsonWithRequestId(
        { error: clientErrorMessage('invalid_input', 'Invalid code') },
        400,
        requestId
      )
    }

    const supabase = createServerClient()
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('lifetime_recruiting_unlocked')
      .eq('clerk_id', userId)
      .maybeSingle()

    if (lookupError) {
      logger.error('Redeem code lookup failed', {
        requestId,
        route: '/api/billing/redeem-code',
        userId,
        error: lookupError.message,
      })
      return jsonWithRequestId(
        { error: clientErrorMessage('server', 'Could not verify your account right now.') },
        500,
        requestId
      )
    }

    if (existingUser?.lifetime_recruiting_unlocked) {
      return jsonWithRequestId(
        {
          success: true,
          plan: 'recruiting',
          alreadyActive: true,
          message: 'Recruiting lifetime plan is already active for your account.',
        },
        200,
        requestId
      )
    }

    const clerkUser = await currentUser()
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || null

    const { error: updateError } = await supabase.from('users').upsert(
      {
        clerk_id: userId,
        email: primaryEmail,
        plan: 'recruiting',
        lifetime_recruiting_unlocked: true,
        lifetime_recruiting_unlocked_at: new Date().toISOString(),
        lifetime_recruiting_code: LIFETIME_RECRUITING_CODE_ID,
      },
      { onConflict: 'clerk_id' }
    )

    if (updateError) {
      logger.error('Redeem code update failed', {
        requestId,
        route: '/api/billing/redeem-code',
        userId,
        error: updateError.message,
      })
      return jsonWithRequestId(
        { error: clientErrorMessage('server', 'Could not activate Recruiting plan right now.') },
        500,
        requestId
      )
    }

    logger.info('Lifetime recruiting code redeemed', {
      requestId,
      route: '/api/billing/redeem-code',
      userId,
      codeId: LIFETIME_RECRUITING_CODE_ID,
      configuredFromEnvKey: sourceKey,
    })

    return jsonWithRequestId(
      {
        success: true,
        plan: 'recruiting',
        alreadyActive: false,
        message: 'Code redeemed. Recruiting lifetime plan is now active.',
      },
      200,
      requestId
    )
  } catch (error) {
    logger.error('Redeem code route failed', {
      requestId,
      route: '/api/billing/redeem-code',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
