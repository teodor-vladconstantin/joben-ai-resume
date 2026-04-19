import { auth } from '@clerk/nextjs/server'
import { askClaudeForJson } from '@/lib/claude'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { trackProductEvent } from '@/lib/analytics'
import { enforceApiRateLimit } from '@/lib/api-rate-limit'
import { getEmailHintFromSessionClaims, getUserPlan, hasResumeAnalysisAccess } from '@/lib/plans'

const ANALYZE_SYSTEM_PROMPT = `You are an elite resume analyst and ATS expert. Analyze the resume and return ONLY valid JSON, no markdown, no preamble.

Score across 5 categories:
- ATS & Structure: max 20 pts
- Content Quality: max 40 pts
- Writing Quality: max 10 pts
- Job Match: max 25 pts
- Application Ready: max 5 pts

Note: scores are out of 20/40/10/25/5 (total 100).
Be strict. 85+ should be rare.

Return:
{
  "overall_score": int,
  "grade": "Critical|Poor|Fair|Good|Excellent|Outstanding",
  "job_match_mode": "job_description|general",
  "categories": {
    "ats_structure": { "score": int, "max": 20, "label": "ATS & Structure", "feedback": "string", "status": "needs_work|ok|good" },
    "content_quality": { "score": int, "max": 40, "label": "Content", "feedback": "string", "status": "needs_work|ok|good" },
    "writing_quality": { "score": int, "max": 10, "label": "Writing", "feedback": "string", "status": "needs_work|ok|good" },
    "job_match": { "score": int, "max": 25, "label": "Job Match", "feedback": "string", "status": "needs_work|ok|good" },
    "application_ready": { "score": int, "max": 5, "label": "Ready", "feedback": "string", "status": "needs_work|ok|good" }
  },
  "strengths": ["string", "string", "string"],
  "improvements": [
    { "issue": "string", "weak_example": "string", "strong_example": "string" }
  ],
  "keywords_found": ["string"],
  "keywords_missing": ["string"],
  "ats_warnings": ["string"],
  "worst_category": "ats_structure|content_quality|writing_quality|job_match|application_ready"
}`

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const emailHint = getEmailHintFromSessionClaims(sessionClaims)

  const body = (await req.json()) as {
    resumeText?: string
    jobDescription?: string
    resumeId?: string
  }

  if (!body.resumeText || !body.resumeText.trim()) {
    return jsonWithRequestId({ error: 'resumeText is required' }, 400, requestId)
  }

  const plan = await getUserPlan(userId, emailHint)
  if (!hasResumeAnalysisAccess(plan)) {
    return jsonWithRequestId(
      {
        error: 'Resume analysis is available on Pro and Recruiting plans.',
        showUpgrade: true,
        requiredPlan: 'pro',
        currentPlan: plan,
      },
      403,
      requestId
    )
  }

  const apiLimit = await enforceApiRateLimit({
    route: 'analyze',
    userId,
    plan,
  })

  if (!apiLimit.allowed) {
    return jsonWithRequestId(
      {
        error: apiLimit.error || 'Daily limit reached. Try again tomorrow.',
        showUpgrade: apiLimit.showUpgrade || false,
        currentPlan: plan,
        limit: apiLimit.limit,
        remaining: apiLimit.remaining,
        resetAt: apiLimit.resetAt,
      },
      apiLimit.status,
      requestId
    )
  }

  try {
    const prompt = `Resume:\n${body.resumeText}\n\nJob description:\n${body.jobDescription || 'N/A'}`
    const analysis = await askClaudeForJson(ANALYZE_SYSTEM_PROMPT, prompt)

    const supabase = createServerClient()
    const { data: createdReview, error: insertError } = await supabase
      .from('ai_reviews')
      .insert({
        user_id: userId,
        resume_id: body.resumeId || null,
        score: Number(analysis?.overall_score || 0),
        feedback: analysis,
      })
      .select('id')
      .single()

    if (insertError) {
      logger.error('Failed to insert AI review', {
        requestId,
        userId,
        route: '/api/analyze',
        error: insertError.message,
      })
      return jsonWithRequestId({ error: insertError.message }, 500, requestId)
    }

    logger.info('AI review created', {
      requestId,
      userId,
      route: '/api/analyze',
      reviewId: createdReview.id,
    })

    await trackProductEvent({
      userId,
      eventName: 'resume_analyzed',
      requestId,
      metadata: {
        resumeId: body.resumeId || null,
        reviewId: createdReview.id,
        hasJobDescription: Boolean(body.jobDescription?.trim()),
      },
    })

    return jsonWithRequestId({ result: analysis, reviewId: createdReview.id }, 200, requestId)
  } catch (error) {
    const message = (error as Error).message
    logger.error('Analyze route failed', {
      requestId,
      userId,
      route: '/api/analyze',
      error: message,
    })
    return jsonWithRequestId({ error: message }, 500, requestId)
  }
}
