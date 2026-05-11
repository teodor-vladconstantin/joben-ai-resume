import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { trackProductEvent } from '@/lib/analytics'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { apiError, apiSuccess } from '@/lib/api-response'
import { clientErrorMessage } from '@/lib/security/client-error'
import { createCoverLetterSchema } from '@/lib/validation/schemas'

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
      .from('cover_letters')
      .select('id, title, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      if (isMissingRelation(error)) {
        return apiSuccess({ letters: [] }, 200)
      }
      logger.error('cover-letters GET failed', { userId, error: error.message })
      return apiError(clientErrorMessage('server'), 500)
    }

    return apiSuccess({ letters: data || [] }, 200)
  } catch (error) {
    logger.error('cover-letters GET top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = createCoverLetterSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const body = parsed.data

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('cover_letters')
      .insert({
        user_id: userId,
        title: body.title || 'Untitled Cover Letter',
        content: body.content || '',
      })
      .select('id, title, updated_at, content')
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return jsonWithRequestId({ error: clientErrorMessage('server', 'Cover letters table is missing in Supabase.') }, 500, requestId)
      }
      logger.error('cover-letters POST failed', { requestId, userId, error: error.message })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    await trackProductEvent({
      userId,
      eventName: 'cover_letter_created',
      requestId,
      metadata: {
        letterId: data.id,
        title: data.title,
      },
    })

    return jsonWithRequestId({ letter: data }, 201, requestId)
  } catch (error) {
    logger.error('cover-letters POST top-level failure', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
