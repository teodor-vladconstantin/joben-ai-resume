import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { trackProductEvent } from '@/lib/analytics'
import { getRequestId, jsonWithRequestId } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getUserPlan, isGodModeEmailAddress } from '@/lib/plans'
import { checkFeatureLimit, getMonthlyResetAtIso, incrementFeatureCounter, recordLimitHit } from '@/lib/ratelimit'
import { apiError, apiSuccess, getErrorMessage } from '@/lib/api-response'

function isMissingRelation(error: unknown): boolean {
  const err = error as { code?: string; message?: string }
  return err?.code === '42P01' || err?.code === 'PGRST205' || (err?.message || '').includes('relation')
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError('Unauthorized', 401)
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
      return apiError(error.message, 500)
    }

    return apiSuccess({ resumes: data || [] }, 200)
  } catch (error) {
    return apiError(getErrorMessage(error), 500)
  }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)
    const isGodMode = isGodModeEmailAddress(emailHint)
    const plan = await getUserPlan(userId, emailHint)
    const featureCheck = isGodMode ? { allowed: true, used: 0, limit: null, blocked: false } : await checkFeatureLimit(userId, 'cvs', plan)
    if (!featureCheck.allowed) {
      await recordLimitHit(userId, 'cvs')

      if (featureCheck.blocked) {
        return jsonWithRequestId(
          {
            error: 'Accesul la acest feature a fost suspendat temporar. Contacteaza suportul.',
            limitType: 'blocked',
            feature: 'cvs',
            resetAt: getMonthlyResetAtIso(),
          },
          429,
          requestId
        )
      }

      return jsonWithRequestId(
        {
          error: `Ai utilizat toate cele ${featureCheck.limit || 0} CV-uri disponibile pe acest plan.`,
          limitType: 'feature',
          feature: 'cvs',
          used: featureCheck.used,
          limit: featureCheck.limit,
          resetAt: getMonthlyResetAtIso(),
        },
        429,
        requestId
      )
    }

    const body = (await req.json()) as {
      title?: string
      data?: Record<string, unknown>
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
        return jsonWithRequestId({ error: 'Resumes table is missing in Supabase.' }, 500, requestId)
      }
      return jsonWithRequestId({ error: error.message }, 500, requestId)
    }

    if (!data?.id) {
      return jsonWithRequestId({ error: 'Failed to create resume.' }, 500, requestId)
    }

    await incrementFeatureCounter(userId, 'cvs')

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
    return jsonWithRequestId({ error: getErrorMessage(error) }, 500, requestId)
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(req.url)
    const resumeId = searchParams.get('id')

    if (!resumeId) {
      return apiError('Missing resume id', 400)
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', userId)

    if (error) {
      if (isMissingRelation(error)) {
        return apiError('Resumes table is missing in Supabase.', 500)
      }
      return apiError(error.message, 500)
    }

    return apiSuccess({ deleted: true }, 200)
  } catch (error) {
    return apiError(getErrorMessage(error), 500)
  }
}
