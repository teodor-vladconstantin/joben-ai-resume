import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { trackProductEvent } from '@/lib/analytics'
import { getRequestId, jsonWithRequestId } from '@/lib/logger'

function isMissingRelation(error: unknown): boolean {
  const err = error as { code?: string; message?: string }
  return err?.code === '42P01' || err?.code === 'PGRST205' || (err?.message || '').includes('relation')
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('cover_letters')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json({ letters: [] }, { status: 200 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ letters: data || [] }, { status: 200 })
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const { userId } = await auth()
  if (!userId) {
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const body = (await req.json()) as { title?: string; content?: string }

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
      return jsonWithRequestId({ error: 'Cover letters table is missing in Supabase.' }, 500, requestId)
    }
    return jsonWithRequestId({ error: error.message }, 500, requestId)
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
}
