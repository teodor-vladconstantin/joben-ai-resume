import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { trackProductEvent } from '@/lib/analytics'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { checkResumeCreationQuota, getEmailHintFromSessionClaims, getUserPlan, isGodModeUser } from '@/lib/plans'
import { apiError, apiSuccess } from '@/lib/api-response'
import { clientErrorMessage } from '@/lib/security/client-error'
import { createResumeSchema, exceedsJsonBudget, uuidLike } from '@/lib/validation/schemas'

function isMissingRelation(error: unknown): boolean {
  const err = error as { code?: string; message?: string }
  return err?.code === '42P01' || err?.code === 'PGRST205' || (err?.message || '').includes('relation')
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError(clientErrorMessage('auth'), 401)
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('resumes')
      .select('id, title, updated_at, score')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      if (isMissingRelation(error)) {
        return apiSuccess({ resumes: [] }, 200)
      }
      logger.error('resumes GET failed', { route: '/api/resumes', error: error.message })
      return apiError(clientErrorMessage('server'), 500)
    }

    return apiSuccess({ resumes: data || [] }, 200)
  } catch (error) {
    logger.error('resumes GET top-level failure', {
      route: '/api/resumes',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)
    const [plan, godMode] = await Promise.all([
      getUserPlan(userId, emailHint),
      isGodModeUser(userId),
    ])
    if (!godMode) {
      const quotaCheck = await checkResumeCreationQuota(userId, plan)
      if (!quotaCheck.allowed) {
        return jsonWithRequestId(
          {
            error: quotaCheck.error || 'Resume limit reached for your plan.',
            showUpgrade: quotaCheck.showUpgrade ?? false,
            limit: quotaCheck.limit,
            used: quotaCheck.used,
          },
          quotaCheck.status as 403 | 429 | 500,
          requestId
        )
      }
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = createResumeSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const body = parsed.data
    // SECURITY: reject oversized resume blobs before they reach Supabase.
    if (body.data && exceedsJsonBudget(body.data)) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'Resume payload is too large.') }, 413, requestId)
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        title: body.title || 'Untitled Resume',
        data: body.data || {},
        score: 0,
      })
      .select('id, title, updated_at, score, data')
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return jsonWithRequestId({ error: clientErrorMessage('server', 'Resumes table is missing in Supabase.') }, 500, requestId)
      }
      logger.error('resumes POST insert failed', { requestId, userId, route: '/api/resumes', error: error.message })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    if (!data?.id) {
      return jsonWithRequestId({ error: 'Failed to create resume.' }, 500, requestId)
    }

    await trackProductEvent({
      userId,
      eventName: 'resume_created',
      requestId,
      metadata: {
        resumeId: data.id,
        title: data.title,
      },
    })

    return jsonWithRequestId({ resume: data }, 201, requestId)
  } catch (error) {
    logger.error('resumes POST top-level failure', {
      requestId,
      route: '/api/resumes',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError(clientErrorMessage('auth'), 401)
    }

    const { searchParams } = new URL(req.url)
    const resumeId = searchParams.get('id')

    const parsedId = uuidLike.safeParse(resumeId)
    if (!parsedId.success) {
      return apiError(clientErrorMessage('invalid_input', 'Missing or invalid resume id'), 400)
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', parsedId.data)
      .eq('user_id', userId)

    if (error) {
      if (isMissingRelation(error)) {
        return apiError(clientErrorMessage('server', 'Resumes table is missing in Supabase.'), 500)
      }
      logger.error('resumes DELETE failed', { userId, route: '/api/resumes', error: error.message })
      return apiError(clientErrorMessage('server'), 500)
    }

    return apiSuccess({ deleted: true }, 200)
  } catch (error) {
    logger.error('resumes DELETE top-level failure', {
      route: '/api/resumes',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}
