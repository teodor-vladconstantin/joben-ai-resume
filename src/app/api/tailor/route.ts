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
import { findNewClaims } from '@/lib/claim-diff'
import { tailorResponseSchema, tailorSchema } from '@/lib/validation/schemas'

// CRITICAL: jobIndex/bulletIndex must be explicit and echoed back by Claude.
// A prior version asked for a flat `updatedBullets: string[]` and matched
// result[i] back to experience[i] by array position — nothing constrained
// Claude to return bullets in that order, so bullets from one job (e.g. an
// AI-focused Founder role) came back rewritten as if they belonged to a
// different job (e.g. a backend Tech Director role). Never go back to
// positional matching here.
const TAILOR_SYSTEM_PROMPT = `Optimize resume bullets for the target job description.

The user prompt lists existing bullets grouped by job, labeled "Job <jobIndex>" with each
bullet prefixed "[<bulletIndex>]". Rewrite only the bullets most relevant to the job
description — you do not need to rewrite every bullet, and never invent a bullet that
wasn't given to you.

Return ONLY JSON in this exact shape:
{
  "updatedBullets": [
    { "jobIndex": number, "bulletIndex": number, "text": "string" }
  ],
  "summary": "string"
}

jobIndex and bulletIndex must exactly match the numbers given in the input list — never
guess, renumber, or reorder them.

"summary" is a rewritten version of the candidate's own resume summary/profile paragraph
(2-4 sentences, third person or implied subject — never "I"), tailored to this job
description. It is content for the candidate's resume, written as if the candidate wrote
it. It is NEVER an evaluation, critique, fit assessment, or gap analysis — never write
sentences like "the candidate lacks..." or "to be competitive, the candidate should...".
If the resume data has no existing summary to rewrite, return an empty string instead of
inventing an assessment.`

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

type ExperienceJob = { title: string; company: string; bullets: string[] }

// Per-experience job/bullets, keyed by array index (jobIndex) — the same
// index Claude is required to echo back. Called once on the raw resumeData
// (anti-hallucination baseline: compare against what the user actually
// wrote) and once on the sanitized copy (building the prompt listing).
function getExperienceJobs(resumeData: Record<string, unknown>): ExperienceJob[] {
  if (!Array.isArray(resumeData.experience)) return []
  return resumeData.experience.map((entry) => {
    if (!isRecord(entry)) return { title: '', company: '', bullets: [] }
    return {
      title: typeof entry.title === 'string' ? entry.title : '',
      company: typeof entry.company === 'string' ? entry.company : '',
      bullets: Array.isArray(entry.bullets)
        ? entry.bullets.filter((bullet): bullet is string => typeof bullet === 'string')
        : [],
    }
  })
}

function buildBulletListingForPrompt(jobs: ExperienceJob[]): string {
  return jobs
    .map((job, jobIndex) => {
      const header = `Job ${jobIndex}: ${[job.title, job.company].filter(Boolean).join(' @ ') || '(untitled role)'}`
      const bulletLines = job.bullets.length
        ? job.bullets.map((bullet, bulletIndex) => `[${bulletIndex}] ${bullet}`).join('\n')
        : '(no bullets)'
      return `${header}\n${bulletLines}`
    })
    .join('\n\n')
}

type ValidatedTailoredBullet = { jobIndex: number; bulletIndex: number; text: string }

// Defensive: Claude is instructed to echo back real jobIndex/bulletIndex
// values, but nothing stops it from hallucinating an out-of-range one. Drop
// those rather than crash or silently write into the wrong bullet.
function isValidTailoredBullet(value: unknown, jobs: ExperienceJob[]): value is ValidatedTailoredBullet {
  if (!isRecord(value)) return false
  const { jobIndex, bulletIndex, text } = value
  if (typeof jobIndex !== 'number' || !Number.isInteger(jobIndex) || jobIndex < 0) return false
  if (typeof bulletIndex !== 'number' || !Number.isInteger(bulletIndex) || bulletIndex < 0) return false
  if (typeof text !== 'string' || !text.trim()) return false
  const job = jobs[jobIndex]
  return Boolean(job && bulletIndex < job.bullets.length)
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

      const bulletListing = buildBulletListingForPrompt(getExperienceJobs(safeResumeData))

      const prompt = `Optimization type: ${body.optimizationType || 'general'}\n\nResume data:\n${JSON.stringify(safeResumeData)}\n\nBullets to rewrite (use these exact jobIndex/bulletIndex values):\n${bulletListing}\n\nJob description:\n${safeJobDescription}${skillGapLine}`
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

      // Raw resumeData (not the sanitized/prompt copy) is the anti-
      // hallucination baseline — comparing against what the user actually
      // wrote, not a sanitized approximation of it.
      const jobs = getExperienceJobs(body.resumeData)
      const validTailoredBullets = isRecord(rawResult) && Array.isArray(rawResult.updatedBullets)
        ? rawResult.updatedBullets.filter((item): item is ValidatedTailoredBullet =>
            isValidTailoredBullet(item, jobs)
          )
        : []

      // Each rewritten bullet is looked up by its own (jobIndex, bulletIndex)
      // — never by its position in this array — so "original" and "context"
      // (every other bullet of that same job) always belong to the job the
      // bullet actually came from.
      const updatedBullets = await Promise.all(
        validTailoredBullets.map(async (item) => {
          const job = jobs[item.jobIndex]
          const original = job.bullets[item.bulletIndex] || ''
          const context = job.bullets.filter((_, index) => index !== item.bulletIndex).join('\n')
          const newClaims = await findNewClaims(original, context, item.text)
          return { jobIndex: item.jobIndex, bulletIndex: item.bulletIndex, text: item.text, newClaims }
        })
      )

      const candidateResult = {
        ...(isRecord(rawResult) ? rawResult : {}),
        updatedBullets,
        missingSkills,
      }
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
        updatedBulletsCount: updatedBullets.length,
        flaggedBulletsCount: updatedBullets.filter((item) => item.newClaims.length > 0).length,
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
