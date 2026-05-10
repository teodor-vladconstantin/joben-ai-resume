import { auth } from '@clerk/nextjs/server'
import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  isRateLimitExceededError,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import { ClaudeJsonParseError, parseClaudeJsonText } from '@/lib/claude-json'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { trackProductEvent } from '@/lib/analytics'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { estimateRequestCost } from '@/lib/token-estimator'
import { getErrorMessage } from '@/lib/api-response'
import { stripProviderMentions } from '@/lib/ai-errors'

const ANALYZE_SYSTEM_PROMPT = `You are an elite resume analyst and ATS expert. Analyze the resume and return ONLY valid JSON, no markdown, no preamble.

Score across 5 categories:
- ATS & Structure: max 20 pts
- Content Quality: max 40 pts
- Writing Quality: max 10 pts
- Job Match: max 25 pts
- Application Ready: max 5 pts

Note: scores are out of 20/40/10/25/5 (total 100).
Be strict. 85+ should be rare.
Important rules:
- Concurrent/overlapping roles are NORMAL and must NOT be flagged as an issue.
- Missing graduation dates for education entries are minor cosmetic gaps — do NOT list them as priority improvements.
Keep output compact:
- strengths: exactly 3 short items
- improvements: max 3 items
- keywords_found: max 10 items
- keywords_missing: max 10 items
- ats_warnings: max 5 items
- feedback strings: max 2 short sentences

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
  try {
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

    const costEstimate = estimateRequestCost(body.resumeText, body.jobDescription, 'resume_analysis')
    if (!costEstimate.withinLimit) {
      const suggested = costEstimate.suggestedMaxChars ?? 16000
      const label = costEstimate.limitType === 'jd_too_long'
        ? `Job description-ul este prea lung. Rezumă la ${suggested} caractere (~${Math.round(suggested / 4)} tokens).`
        : `CV-ul este prea lung. Rezumă la ${suggested} caractere (~${Math.round(suggested / 4)} tokens).`
      return jsonWithRequestId({ error: label, limitType: 'input_too_long' }, 429, requestId)
    }

    try {
      const prompt = `Resume:\n${body.resumeText}\n\nJob description:\n${body.jobDescription || 'N/A'}`
      const messages: MessageParam[] = [
        {
          role: 'user',
          content: prompt,
        },
      ]

      const aiResponse = await callAnthropicWithLimits({
        userId,
        plan,
        feature: 'reviews',
        inputText: prompt,
        messages,
        system: ANALYZE_SYSTEM_PROMPT,
      })

      const analysisText = extractTextFromAnthropicMessage(aiResponse)
      const analysis = parseClaudeJsonText(analysisText) as Record<string, unknown> & { overall_score?: number }

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
      if (isRateLimitExceededError(error)) {
        return jsonWithRequestId(error.payload, error.status, requestId)
      }

      const message = error instanceof ClaudeJsonParseError
        ? 'AI response format was invalid. Please retry.'
        : stripProviderMentions(getErrorMessage(error))

      logger.error('Analyze route failed', {
        requestId,
        userId,
        route: '/api/analyze',
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return jsonWithRequestId({ error: message }, 500, requestId)
    }
  } catch (error) {
    return jsonWithRequestId({ error: stripProviderMentions(getErrorMessage(error)) }, 500, requestId)
  }
}
