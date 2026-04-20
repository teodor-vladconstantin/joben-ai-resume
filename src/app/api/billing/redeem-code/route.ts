import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'

export const runtime = 'nodejs'

const DEFAULT_RECRUITING_LIFETIME_CODE = 'JOBEN100'

function normalizeCode(input: string | null | undefined): string {
  return (input || '').trim().toUpperCase()
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

  const expectedCode = normalizeCode(process.env.RECRUITING_LIFETIME_CODE || DEFAULT_RECRUITING_LIFETIME_CODE)
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
      lifetime_recruiting_code: submittedCode,
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
    code: submittedCode,
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
