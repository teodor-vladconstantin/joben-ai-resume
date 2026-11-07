import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-response'
import { getRequestId, logger } from '@/lib/logger'
import { renderAccountExportPdf } from '@/lib/account-export-pdf'

export async function GET(req: Request) {
  const requestId = getRequestId(req)
  const { userId } = await auth()
  if (!userId) {
    return apiError('You must be signed in.', 401, requestId)
  }

  const supabase = createServerClient()

  const [user, resumes, coverLetters, aiReviews, resumeAnalyses, feedback, emailEvents, productEvents, anonymousScans, referralsMade, referralsReceived, legalAcceptances, withdrawals] = await Promise.all([
    supabase.from('users').select('*').eq('clerk_id', userId).maybeSingle(),
    supabase.from('resumes').select('*').eq('user_id', userId),
    supabase.from('cover_letters').select('*').eq('user_id', userId),
    supabase.from('ai_reviews').select('*').eq('user_id', userId),
    supabase.from('resume_analyses').select('*').eq('user_id', userId),
    supabase.from('feedback').select('*').eq('user_id', userId),
    supabase.from('email_events').select('*').eq('user_clerk_id', userId),
    supabase.from('product_events').select('*').eq('user_clerk_id', userId),
    supabase.from('anonymous_scans').select('*').eq('claimed_by', userId),
    supabase.from('referrals').select('*').eq('referrer_id', userId),
    supabase.from('referrals').select('*').eq('referred_user_id', userId),
    supabase.from('legal_acceptances').select('*').eq('user_clerk_id', userId),
    supabase.from('withdrawal_requests').select('*').eq('user_clerk_id', userId),
  ])

  const firstError = [user, resumes, coverLetters, aiReviews, resumeAnalyses, feedback, emailEvents, productEvents, anonymousScans, referralsMade, referralsReceived, legalAcceptances, withdrawals]
    .map((result) => result.error)
    .find(Boolean)

  if (firstError) {
    logger.error('Data export failed', { requestId, userId, error: firstError.message })
    return apiError('Could not generate your data export.', 500, requestId)
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
    productEvents: productEvents.data,
    anonymousScans: anonymousScans.data,
    referralsMade: referralsMade.data,
    referralsReceived: referralsReceived.data,
    legalAcceptances: legalAcceptances.data,
    withdrawalRequests: withdrawals.data,
  }

  const stamp = new Date().toISOString().slice(0, 10)

  if (new URL(req.url).searchParams.get('format') === 'pdf') {
    try {
      const pdfBytes = await renderAccountExportPdf({
        exportedAt: exportPayload.exportedAt,
        account: exportPayload.account,
        resumes: exportPayload.resumes,
        coverLetters: exportPayload.coverLetters,
        aiReviews: exportPayload.aiReviews,
        resumeAnalyses: exportPayload.resumeAnalyses,
        feedback: exportPayload.feedback,
        legalAcceptances: exportPayload.legalAcceptances,
        withdrawalRequests: exportPayload.withdrawalRequests,
        referralsMade: exportPayload.referralsMade,
        referralsReceived: exportPayload.referralsReceived,
      })
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="joben-data-export-${stamp}.pdf"`,
        },
      })
    } catch (error) {
      logger.error('Data export PDF failed', { requestId, userId, error: error instanceof Error ? error.message : 'Unknown error' })
      return apiError('Could not generate your data export.', 500, requestId)
    }
  }

  const filename = `joben-data-export-${stamp}.json`

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
