import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

function isMissingRelation(error: unknown): boolean {
  const err = error as { code?: string; message?: string }
  return err?.code === '42P01' || err?.code === 'PGRST205' || (err?.message || '').includes('relation')
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('ai_reviews')
    .select('id, score, created_at, resume_id, feedback, resumes(title)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json({ error: 'AI reviews table is missing in Supabase.' }, { status: 500 })
    }
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  let comparison: {
    previousScore: number | null
    previousReviewId: string | null
    delta: number | null
  } | null = null

  if (data.resume_id) {
    const { data: previous } = await supabase
      .from('ai_reviews')
      .select('id, score, created_at')
      .eq('user_id', userId)
      .eq('resume_id', data.resume_id)
      .lt('created_at', data.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (previous) {
      const currentScore = Number(data.score || 0)
      const previousScore = Number(previous.score || 0)
      comparison = {
        previousScore,
        previousReviewId: previous.id,
        delta: currentScore - previousScore,
      }
    } else {
      comparison = {
        previousScore: null,
        previousReviewId: null,
        delta: null,
      }
    }
  }

  return NextResponse.json({ review: data, comparison }, { status: 200 })
}
