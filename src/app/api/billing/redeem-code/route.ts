import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'

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

function normalizeCode(input: string | null | undefined): string {
  return (input || '').trim().toUpperCase()
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
  const { userId } = await auth()

  if (!userId) {
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  let body: { code?: string } | null = null

  try {
    body = (await req.json()) as { code?: string }
  } catch {
    return jsonWithRequestId({ error: 'Invalid JSON body' }, 400, requestId)
  }

  const submittedCode = normalizeCode(body?.code)
  if (!submittedCode) {
    return jsonWithRequestId({ error: 'code is required' }, 400, requestId)
  }

  const { code: expectedCode, sourceKey } = resolveExpectedCode()
  if (!expectedCode) {
    logger.error('Redeem code config missing', {
      requestId,
      route: '/api/billing/redeem-code',
      userId,
      checkedEnvKeys: REDEEM_CODE_ENV_KEYS,
    })
    return jsonWithRequestId({ error: 'Redeem code is not configured.' }, 500, requestId)
  }

  if (submittedCode !== expectedCode) {
    return jsonWithRequestId({ error: 'Invalid code' }, 400, requestId)
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
    return jsonWithRequestId({ error: 'Could not verify your account right now.' }, 500, requestId)
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
    return jsonWithRequestId({ error: 'Could not activate Recruiting plan right now.' }, 500, requestId)
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
}
