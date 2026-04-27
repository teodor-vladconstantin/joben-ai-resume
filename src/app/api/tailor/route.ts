import { auth } from '@clerk/nextjs/server'
import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  isRateLimitExceededError,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import { parseClaudeJsonText } from '@/lib/claude-json'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { getErrorMessage } from '@/lib/api-response'

const TAILOR_SYSTEM_PROMPT = `Optimize resume bullets for the target job. Return ONLY JSON:
{
  "updatedBullets": ["string"],
  "summary": "string"
}`

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)

    const plan = await getUserPlan(userId, emailHint)

    const body = (await req.json()) as {
      resumeData?: Record<string, unknown>
      jobDescription?: string
      optimizationType?: 'job_specific' | 'general'
    }

    if (!body.resumeData || !body.jobDescription) {
      return jsonWithRequestId({ error: 'resumeData and jobDescription are required' }, 400, requestId)
    }

    try {
      const prompt = `Optimization type: ${body.optimizationType || 'general'}\n\nResume data:\n${JSON.stringify(body.resumeData)}\n\nJob description:\n${body.jobDescription}`
      const messages: MessageParam[] = [
        {
          role: 'user',
          content: prompt,
        },
      ]

      const aiResponse = await callAnthropicWithLimits({
        userId,
        plan,
        feature: 'jds',
        inputText: prompt,
        messages,
        system: TAILOR_SYSTEM_PROMPT,
      })

      const result = parseClaudeJsonText(extractTextFromAnthropicMessage(aiResponse))
      logger.info('Tailor request completed', {
        requestId,
        userId,
        route: '/api/tailor',
        optimizationType: body.optimizationType || 'general',
      })
      return jsonWithRequestId({ result }, 200, requestId)
    } catch (error) {
      if (isRateLimitExceededError(error)) {
        return jsonWithRequestId(error.payload, error.status, requestId)
      }

      const message = getErrorMessage(error)
      logger.error('Tailor route failed', {
        requestId,
        userId,
        route: '/api/tailor',
        error: message,
      })
      return jsonWithRequestId({ error: message }, 500, requestId)
    }
  } catch (error) {
    return jsonWithRequestId({ error: getErrorMessage(error) }, 500, requestId)
  }
}
