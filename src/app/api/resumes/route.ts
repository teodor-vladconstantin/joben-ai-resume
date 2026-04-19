import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { trackProductEvent } from '@/lib/analytics'
import { getRequestId, jsonWithRequestId } from '@/lib/logger'
import { checkResumeCreationQuota, getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'

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
    .from('resumes')
    .select('id, title, updated_at, score')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json({ resumes: [] }, { status: 200 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ resumes: data || [] }, { status: 200 })
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const emailHint = getEmailHintFromSessionClaims(sessionClaims)
  const plan = await getUserPlan(userId, emailHint)
  const quotaCheck = await checkResumeCreationQuota(userId, plan)
  if (!quotaCheck.allowed) {
    return jsonWithRequestId(
      {
        error: quotaCheck.error || 'Could not validate plan limits right now. Please try again.',
        showUpgrade: quotaCheck.showUpgrade || false,
        limit: quotaCheck.limit,
        used: quotaCheck.used,
        remaining: quotaCheck.remaining,
        currentPlan: plan,
      },
      quotaCheck.status,
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
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const resumeId = searchParams.get('id')

  if (!resumeId) {
    return NextResponse.json({ error: 'Missing resume id' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', resumeId)
    .eq('user_id', userId)

  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json({ error: 'Resumes table is missing in Supabase.' }, { status: 500 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
