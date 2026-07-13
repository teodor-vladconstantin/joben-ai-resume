import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return apiError('You must be signed in.', 401)
  }

  const supabase = createServerClient()

  const [user, resumes, coverLetters, aiReviews, resumeAnalyses, feedback, emailEvents] = await Promise.all([
    supabase.from('users').select('*').eq('clerk_id', userId).maybeSingle(),
    supabase.from('resumes').select('*').eq('user_id', userId),
    supabase.from('cover_letters').select('*').eq('user_id', userId),
    supabase.from('ai_reviews').select('*').eq('user_id', userId),
    supabase.from('resume_analyses').select('*').eq('user_id', userId),
    supabase.from('feedback').select('*').eq('user_id', userId),
    supabase.from('email_events').select('*').eq('user_clerk_id', userId),
  ])

  const firstError = [user, resumes, coverLetters, aiReviews, resumeAnalyses, feedback, emailEvents]
    .map((result) => result.error)
    .find(Boolean)

  if (firstError) {
    logger.error('Data export failed', { userId, error: firstError.message })
    return apiError('Could not generate your data export.', 500)
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    format: 'joben-gdpr-export-v1',
    account: user.data,
    resumes: resumes.data,
    coverLetters: coverLetters.data,
    aiReviews: aiReviews.data,
    resumeAnalyses: resumeAnalyses.data,
    feedback: feedback.data,
    emailEvents: emailEvents.data,
  }

  const filename = `joben-data-export-${new Date().toISOString().slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
