import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { trackProductEvent } from '@/lib/analytics'
import { capturePostHogEvent } from '@/lib/posthog-server'
import { sendRateLimitEmailIfEligible } from '@/lib/email-automation'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { checkResumeCreationQuota, getEmailHintFromSessionClaims, getUserPlan, isGodModeUser } from '@/lib/plans'
import { sendFirstResumeEmail } from '@/lib/resend'
import { apiError, apiSuccess, deleteOwnedRow, fetchOwnedList, isMissingRelation } from '@/lib/api-response'
import { clientErrorMessage } from '@/lib/security/client-error'
import { createResumeSchema, exceedsJsonBudget, uuidLike } from '@/lib/validation/schemas'

function isDuplicateError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

type ResumeListItem = { id: string; title: string | null; updated_at: string; score: number | null }

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError(clientErrorMessage('auth'), 401)
    }

    const result = await fetchOwnedList<ResumeListItem>({
      table: 'resumes',
      columns: 'id, title, updated_at, score',
      userId,
      logLabel: 'resumes GET failed',
      logContext: { route: '/api/resumes' },
    })

    if (!result.ok) return result.response

    return apiSuccess({ resumes: result.data }, 200)
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
        if (quotaCheck.status === 429) {
          await sendRateLimitEmailIfEligible({
            userId,
            requestId,
            route: '/api/resumes',
            reason: 'resume_creation_limit',
            plan,
          })
        }
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

    // template_id/ai_assisted are hardcoded: the resume schema has no fields for
    // either yet (single 'harvard' template, no AI-assisted-creation flag).
    await capturePostHogEvent({
      distinctId: userId,
      event: 'resume_created',
      properties: {
        template_id: 'harvard',
        ai_assisted: false,
        source: body.source || 'scratch',
      },
    })

    try {
      const { data: existingEmail, error: existingEmailError } = await supabase
        .from('email_events')
        .select('id')
        .eq('user_clerk_id', userId)
        .eq('email_type', 'first_resume_generated')
        .limit(1)

      if (existingEmailError) {
        logger.warn('First resume email lookup failed', {
          requestId,
          route: '/api/resumes',
          userId,
          error: existingEmailError.message,
        })
      }

      if (!existingEmail || existingEmail.length === 0) {
        const { data: userProfile, error: userProfileError } = await supabase
          .from('users')
          .select('email, first_name')
          .eq('clerk_id', userId)
          .maybeSingle()

        if (userProfileError) {
          logger.warn('First resume email user lookup failed', {
            requestId,
            route: '/api/resumes',
            userId,
            error: userProfileError.message,
          })
        } else if (userProfile?.email) {
          const sourceEventId = `resumes.first_generated:${userId}`

          const { error: lockError } = await supabase.from('email_events').insert({
            user_clerk_id: userId,
            email: userProfile.email,
            email_type: 'first_resume_generated',
            status: 'processing',
            source_event_id: sourceEventId,
            metadata: {
              source: 'api.resumes.post',
              requestId,
              resumeId: data.id,
              stage: 'claimed',
            },
          })

          if (lockError) {
            if (!isDuplicateError(lockError)) {
              logger.warn('First resume email lock failed', {
                requestId,
                route: '/api/resumes',
                userId,
                error: lockError.message,
              })
            }
          } else {
            const emailResult = await sendFirstResumeEmail({
              to: userProfile.email,
              firstName: userProfile.first_name,
            })

            const { error: updateError } = await supabase
              .from('email_events')
              .update({
                status: emailResult.success ? 'sent' : 'failed',
                provider_id: emailResult.providerId || null,
                error: emailResult.error || null,
                metadata: {
                  source: 'api.resumes.post',
                  requestId,
                  resumeId: data.id,
                },
              })
              .eq('source_event_id', sourceEventId)

            if (updateError) {
              logger.warn('First resume email event update failed', {
                requestId,
                route: '/api/resumes',
                userId,
                error: updateError.message,
              })
            }

            if (!emailResult.success) {
              logger.warn('First resume email send failed', {
                requestId,
                route: '/api/resumes',
                userId,
                error: emailResult.error || 'Unknown email error',
              })
            }
          }
        }
      }
    } catch (error) {
      logger.warn('First resume email flow failed', {
        requestId,
        route: '/api/resumes',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

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

    return await deleteOwnedRow({
      table: 'resumes',
      id: parsedId.data,
      userId,
      missingRelationMessage: 'Resumes table is missing in Supabase.',
      logLabel: 'resumes DELETE failed',
      logContext: { userId, route: '/api/resumes' },
    })
  } catch (error) {
    logger.error('resumes DELETE top-level failure', {
      route: '/api/resumes',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}
