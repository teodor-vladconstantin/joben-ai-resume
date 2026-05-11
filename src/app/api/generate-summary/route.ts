import { auth } from '@clerk/nextjs/server'
import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  isRateLimitExceededError,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { AI_LIMITS, estimateTokens } from '@/lib/token-estimator'
import { stripProviderMentions } from '@/lib/ai-errors'
import { clientErrorMessage } from '@/lib/security/client-error'
import { sanitizeForPrompt, sanitizeJsonForPrompt } from '@/lib/security/prompt-sanitizer'
import { generateSummarySchema } from '@/lib/validation/schemas'

type SummaryMode = 'resume' | 'scratch'

type ResumeSummaryInput = {
  personal?: {
    firstName?: string
    lastName?: string
    title?: string
    email?: string
    phone?: string
    summary?: string
  }
  experience?: Array<{
    title?: string
    company?: string
    period?: string
    description?: string
    bullets?: string[]
  }>
  dynamicSections?: Array<{
    title?: string
    content?: string
  }>
}

type GenerateSummaryBody = {
  mode?: SummaryMode
  roleDescription?: string
  resumeData?: ResumeSummaryInput
}

const SUMMARY_SYSTEM_PROMPT = `You are an expert resume writer.
Write a professional summary that is:
- Formal tone
- First person perspective
- Maximum 3 sentences
- Clear and specific
Return plain text only, with no bullets, markdown, or extra commentary.`

function compactWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function normalizeSummaryOutput(text: string): string {
  const compact = compactWhitespace(text)
  if (!compact) return ''

  const sentences = (compact.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map((part) => part.trim())
    .filter(Boolean)

  return sentences.slice(0, 3).join(' ')
}

function buildResumeContext(resumeData: ResumeSummaryInput): string {
  const lines: string[] = []

  const personal = resumeData.personal || {}
  if (personal.title?.trim()) {
    lines.push(`Current title: ${personal.title.trim()}`)
  }

  const experience = Array.isArray(resumeData.experience) ? resumeData.experience : []
  if (experience.length > 0) {
    lines.push('Experience:')
    for (const item of experience) {
      const role = compactWhitespace(item.title || '') || 'Role not provided'
      const company = compactWhitespace(item.company || '') || 'Company not provided'
      const period = compactWhitespace(item.period || '')
      const header = period ? `- ${role} at ${company} (${period})` : `- ${role} at ${company}`
      lines.push(header)

      const bullets = Array.isArray(item.bullets)
        ? item.bullets.map((bullet) => compactWhitespace(bullet || '')).filter(Boolean)
        : []

      if (bullets.length > 0) {
        for (const bullet of bullets.slice(0, 4)) {
          lines.push(`  - ${bullet}`)
        }
      } else if (item.description?.trim()) {
        lines.push(`  - ${compactWhitespace(item.description)}`)
      }
    }
  }

  const dynamicSections = Array.isArray(resumeData.dynamicSections) ? resumeData.dynamicSections : []
  if (dynamicSections.length > 0) {
    lines.push('Additional sections:')
    for (const section of dynamicSections.slice(0, 8)) {
      const title = compactWhitespace(section.title || '') || 'Untitled section'
      const content = compactWhitespace(section.content || '')
      if (content) {
        lines.push(`- ${title}: ${content}`)
      }
    }
  }

  return lines.join('\n')
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = generateSummarySchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const body = parsed.data
    const mode = body.mode

    let userPrompt = ''

    if (mode === 'resume') {
      if (!body.resumeData) {
        return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'resumeData is required when mode is "resume".') }, 400, requestId)
      }

      // SECURITY: sanitize every string in the resumeData JSON before
      // feeding it to buildResumeContext and ultimately to the prompt.
      const safeResumeData = sanitizeJsonForPrompt(body.resumeData as ResumeSummaryInput, { maxChars: 4_000 })
      const resumeContext = buildResumeContext(safeResumeData)
      if (!resumeContext.trim()) {
        return jsonWithRequestId(
          { error: clientErrorMessage('invalid_input', 'Resume context is empty. Add experience or sections before generating.') },
          400,
          requestId
        )
      }

      userPrompt = [
        'Generate a professional summary based on this resume context.',
        'Keep it specific to the achievements and skills shown below.',
        '',
        'Resume context:',
        resumeContext,
      ].join('\n')
    }

    if (mode === 'scratch') {
      const safeRoleDescription = sanitizeForPrompt(body.roleDescription, { maxChars: 10_000 })
      const roleDescription = compactWhitespace(safeRoleDescription)
      if (!roleDescription) {
        return jsonWithRequestId(
          { error: clientErrorMessage('invalid_input', 'roleDescription is required when mode is "scratch".') },
          400,
          requestId
        )
      }

      userPrompt = [
        'Generate a professional summary from scratch for this target role.',
        '',
        `Target role description: ${roleDescription}`,
      ].join('\n')
    }

    const estimatedTokens = estimateTokens(`${SUMMARY_SYSTEM_PROMPT}\n${userPrompt}`)
    if (estimatedTokens > AI_LIMITS.summary_gen) {
      return jsonWithRequestId(
        {
          error: `Input is too long for summary generation. Keep it under ${AI_LIMITS.summary_gen * 4} characters (~${AI_LIMITS.summary_gen} tokens).`,
          limitType: 'input_too_long',
        },
        429,
        requestId
      )
    }

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)
    const plan = await getUserPlan(userId, emailHint)

    try {
      const messages: MessageParam[] = [
        {
          role: 'user',
          content: userPrompt,
        },
      ]

      const aiResponse = await callAnthropicWithLimits({
        userId,
        plan,
        feature: 'summaries',
        inputText: userPrompt,
        messages,
        system: SUMMARY_SYSTEM_PROMPT,
      })

      const summary = normalizeSummaryOutput(extractTextFromAnthropicMessage(aiResponse))
      if (!summary) {
        return jsonWithRequestId({ error: 'Could not generate a summary. Please try again.' }, 500, requestId)
      }

      return jsonWithRequestId({ summary }, 200, requestId)
    } catch (error) {
      if (isRateLimitExceededError(error)) {
        return jsonWithRequestId(error.payload, error.status, requestId)
      }

      logger.error('Generate-summary route failed', {
        requestId,
        userId,
        route: '/api/generate-summary',
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return jsonWithRequestId(
        { error: stripProviderMentions(error instanceof Error ? error.message : 'Could not generate summary.') },
        500,
        requestId
      )
    }
  } catch (error) {
    logger.error('Generate-summary route top-level failure', {
      requestId,
      route: '/api/generate-summary',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
