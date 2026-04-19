import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

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
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Resumes table is missing in Supabase.' }, { status: 500 })
    }
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ resume: data }, { status: 200 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Resumes table is missing in Supabase.' }, { status: 500 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ resume: data }, { status: 200 })
}
