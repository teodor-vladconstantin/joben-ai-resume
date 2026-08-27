import { auth } from '@clerk/nextjs/server'
import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  isRateLimitExceededError,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import { parseClaudeJsonText } from '@/lib/claude-json'
import { sendRateLimitEmailIfEligible } from '@/lib/email-automation'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { stripProviderMentions } from '@/lib/ai-errors'
import { clientErrorMessage } from '@/lib/security/client-error'
import { sanitizeForPrompt, sanitizeJsonForPrompt } from '@/lib/security/prompt-sanitizer'
import { callResumeParserJson } from '@/lib/resume-parser-client'
import { computeMissingSkills, extractSkillGapInputText } from '@/lib/skill-gap'
import { tailorResponseSchema, tailorSchema } from '@/lib/validation/schemas'

const TAILOR_SYSTEM_PROMPT = `Optimize resume bullets for the target job. Return ONLY JSON:
{
  "updatedBullets": ["string"],
  "summary": "string"
}`

// Skill-gap analysis rides on the same resume-parser-service used for PDF
// import (see src/app/api/parse/route.ts). It is best-effort: if the parser
// is unreachable, tailoring still proceeds with an empty gap instead of
// failing the whole request.
const MAX_SKILL_EXTRACTION_TEXT_LENGTH = 8_000

type ExtractSkillsResponse = { skills?: string[] }

async function extractSkillsSafely(
  text: string,
  requestId: string,
  source: 'resume' | 'job_description'
): Promise<string[]> {
  const trimmed = text.trim()
  if (!trimmed) return []

  try {
    const response = await callResumeParserJson<ExtractSkillsResponse>('/extract-skills', {
      text: trimmed.slice(0, MAX_SKILL_EXTRACTION_TEXT_LENGTH),
      lang: 'en',
    })
    return Array.isArray(response.skills) ? response.skills : []
  } catch (error) {
    logger.warn('Skill extraction failed, continuing without gap analysis for this source', {
      requestId,
      route: '/api/tailor',
      source,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return []
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)

    const plan = await getUserPlan(userId, emailHint)

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = tailorSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const body = parsed.data
    // SECURITY: sanitize both the JD string and every nested string inside
    // the resumeData blob before they land in the prompt.
    const safeResumeData = sanitizeJsonForPrompt(body.resumeData, { maxChars: 5_000 })
    const safeJobDescription = sanitizeForPrompt(body.jobDescription, { maxChars: 10_000 })

    try {
      const resumeSkillsText = extractSkillGapInputText(body.resumeData)
      const [resumeSkills, jobSkills] = await Promise.all([
        extractSkillsSafely(resumeSkillsText, requestId, 'resume'),
        extractSkillsSafely(body.jobDescription, requestId, 'job_description'),
      ])
      const missingSkills = computeMissingSkills(resumeSkills, jobSkills)

      const skillGapLine =
        missingSkills.length > 0
          ? `\n\nSkills mentioned in the job description but not found in the resume: ${missingSkills.join(', ')}`
          : ''

      const prompt = `Optimization type: ${body.optimizationType || 'general'}\n\nResume data:\n${JSON.stringify(safeResumeData)}\n\nJob description:\n${safeJobDescription}${skillGapLine}`
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

      const rawResult = parseClaudeJsonText(extractTextFromAnthropicMessage(aiResponse))
      const candidateResult = { ...(isRecord(rawResult) ? rawResult : {}), missingSkills }
      const validated = tailorResponseSchema.safeParse(candidateResult)
      // Validation is best-effort: an unexpected Claude output shape should
      // not turn a working tailor response into a 500. Fall back to the raw
      // (pre-validation) shape plus missingSkills, matching the route's
      // pre-existing behavior of passing Claude's JSON through as-is.
      if (!validated.success) {
        logger.warn('Tailor response failed schema validation, passing through unvalidated', {
          requestId,
          userId,
          route: '/api/tailor',
          issues: validated.error.issues.map((issue) => issue.path.join('.')),
        })
      }
      const result = validated.success ? validated.data : candidateResult

      logger.info('Tailor request completed', {
        requestId,
        userId,
        route: '/api/tailor',
        optimizationType: body.optimizationType || 'general',
        missingSkillsCount: missingSkills.length,
      })
      return jsonWithRequestId({ result }, 200, requestId)
    } catch (error) {
      if (isRateLimitExceededError(error)) {
        if (error.status === 429) {
          await sendRateLimitEmailIfEligible({
            userId,
            requestId,
            route: '/api/tailor',
            reason: error.payload?.limitType || 'rate_limit',
            plan,
          })
        }
        return jsonWithRequestId(error.payload, error.status, requestId)
      }

      const rawMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Tailor route failed', {
        requestId,
        userId,
        route: '/api/tailor',
        error: rawMessage,
      })
      return jsonWithRequestId({ error: stripProviderMentions(rawMessage) }, 500, requestId)
    }
  } catch (error) {
    logger.error('Tailor route top-level failure', {
      requestId,
      route: '/api/tailor',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
