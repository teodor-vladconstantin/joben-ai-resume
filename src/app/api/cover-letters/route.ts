import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { trackProductEvent } from '@/lib/analytics'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { apiError, apiSuccess, fetchOwnedList, isMissingRelation } from '@/lib/api-response'
import { clientErrorMessage } from '@/lib/security/client-error'
import { createCoverLetterSchema } from '@/lib/validation/schemas'

type CoverLetterListItem = { id: string; title: string | null; updated_at: string }

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError(clientErrorMessage('auth'), 401)
    }

    const result = await fetchOwnedList<CoverLetterListItem>({
      table: 'cover_letters',
      columns: 'id, title, updated_at',
      userId,
      logLabel: 'cover-letters GET failed',
      logContext: { userId },
    })

    if (!result.ok) return result.response

    return apiSuccess({ letters: result.data }, 200)
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
