import { auth } from '@clerk/nextjs/server'
import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  isRateLimitExceededError,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import { parseClaudeJsonText } from '@/lib/claude-json'
import { getRequestId, jsonWithRequestId } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { getErrorMessage } from '@/lib/api-response'

const COVER_LETTER_SYSTEM_PROMPT = `Generate a cover letter JSON with this exact shape:
{
  "salutation": "string",
  "paragraphs": ["string", "string", "string"],
  "closing": "string"
}

Rules:
- Do not hallucinate facts.
- Do not use cliches.
- Keep language specific and concise.`

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
      company?: string
      position?: string
      jobDescription?: string
      tone?: string
    }

    if (!body.company || !body.position || !body.jobDescription) {
      return jsonWithRequestId({ error: 'company, position and jobDescription are required' }, 400, requestId)
    }

    const plan = await getUserPlan(userId, emailHint)

    try {
      const prompt = `Resume:\n${body.resumeText || 'N/A'}\n\nCompany: ${body.company}\nPosition: ${body.position}\nTone: ${body.tone || 'professional'}\n\nJob description:\n${body.jobDescription}`
      const messages: MessageParam[] = [
        {
          role: 'user',
          content: prompt,
        },
      ]

      const aiResponse = await callAnthropicWithLimits({
        userId,
        plan,
        feature: 'covers',
        inputText: prompt,
        messages,
        system: COVER_LETTER_SYSTEM_PROMPT,
      })

      const generated = parseClaudeJsonText(extractTextFromAnthropicMessage(aiResponse))
      return jsonWithRequestId({ result: generated }, 200, requestId)
    } catch (error) {
      if (isRateLimitExceededError(error)) {
        return jsonWithRequestId(error.payload, error.status, requestId)
      }

      return jsonWithRequestId({ error: getErrorMessage(error) }, 500, requestId)
    }
  } catch (error) {
    return jsonWithRequestId({ error: getErrorMessage(error) }, 500, requestId)
  }
}
