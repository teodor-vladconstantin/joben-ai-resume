import { auth } from '@clerk/nextjs/server'
import { askClaudeForJson } from '@/lib/claude'
import { enforceApiRateLimit } from '@/lib/api-rate-limit'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getUserPlan, hasAtsOptimizationAccess } from '@/lib/plans'

const TAILOR_SYSTEM_PROMPT = `Optimize resume bullets for the target job. Return ONLY JSON:
{
  "updatedBullets": ["string"],
  "summary": "string"
}`

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const emailHint = getEmailHintFromSessionClaims(sessionClaims)

  const plan = await getUserPlan(userId, emailHint)
  if (!hasAtsOptimizationAccess(plan)) {
    return jsonWithRequestId(
      {
        error: 'ATS optimization is available on Pro and Recruiting plans.',
        showUpgrade: true,
        requiredPlan: 'pro',
        currentPlan: plan,
      },
      403,
      requestId
    )
  }

  const body = (await req.json()) as {
    resumeData?: Record<string, unknown>
    jobDescription?: string
    optimizationType?: 'job_specific' | 'general'
  }

  if (!body.resumeData || !body.jobDescription) {
    return jsonWithRequestId({ error: 'resumeData and jobDescription are required' }, 400, requestId)
  }

  const apiLimit = await enforceApiRateLimit({
    route: 'tailor',
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
    const prompt = `Optimization type: ${body.optimizationType || 'general'}\n\nResume data:\n${JSON.stringify(body.resumeData)}\n\nJob description:\n${body.jobDescription}`
    const result = await askClaudeForJson(TAILOR_SYSTEM_PROMPT, prompt)
    logger.info('Tailor request completed', {
      requestId,
      userId,
      route: '/api/tailor',
      optimizationType: body.optimizationType || 'general',
    })
    return jsonWithRequestId({ result }, 200, requestId)
  } catch (error) {
    const message = (error as Error).message
    logger.error('Tailor route failed', {
      requestId,
      userId,
      route: '/api/tailor',
      error: message,
    })
    return jsonWithRequestId({ error: message }, 500, requestId)
  }
}
