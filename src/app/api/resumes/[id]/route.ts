import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, getErrorMessage } from '@/lib/api-response'

function isMissingRelation(error: unknown): boolean {
  const err = error as { code?: string; message?: string }
  return err?.code === '42P01' || err?.code === 'PGRST205' || (err?.message || '').includes('relation')
}

type ResumeData = {
  personal?: {
    firstName?: string
    lastName?: string
    title?: string
    email?: string
    phone?: string
    summary?: string
  }
  experience?: Array<{
    id: string
    title: string
    company: string
    period: string
    description: string
    bullets?: string[]
  }>
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('resumes')
      .select('id, title, updated_at, score, data')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return apiError('Resumes table is missing in Supabase.', 500)
      }
      return apiError(error.message, 404)
    }

    return apiSuccess({ resume: data }, 200)
  } catch (error) {
    return apiError(getErrorMessage(error), 500)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params
    const body = (await req.json()) as { title?: string; data?: ResumeData }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('resumes')
      .update({
        title: body.title,
        data: body.data,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, title, updated_at, score, data')
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return apiError('Resumes table is missing in Supabase.', 500)
      }
      return apiError(error.message, 500)
    }

    return apiSuccess({ resume: data }, 200)
  } catch (error) {
    return apiError(getErrorMessage(error), 500)
  }
}
