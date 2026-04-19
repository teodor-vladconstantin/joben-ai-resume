import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { askClaudeForJson } from '@/lib/claude'
import { enforceApiRateLimit } from '@/lib/api-rate-limit'
import { getEmailHintFromSessionClaims, getUserPlan, hasCoverLetterGenerationAccess } from '@/lib/plans'

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
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    return NextResponse.json({ error: 'company, position and jobDescription are required' }, { status: 400 })
  }

  const plan = await getUserPlan(userId, emailHint)
  if (!hasCoverLetterGenerationAccess(plan)) {
    return NextResponse.json(
      {
        error: 'AI cover letter generation is available on Pro and Recruiting plans.',
        showUpgrade: true,
        requiredPlan: 'pro',
        currentPlan: plan,
      },
      { status: 403 }
    )
  }

  const apiLimit = await enforceApiRateLimit({
    route: 'cover-letter',
    userId,
    plan,
  })

  if (!apiLimit.allowed) {
    return NextResponse.json(
      {
        error: apiLimit.error || 'Daily limit reached. Try again tomorrow.',
        showUpgrade: apiLimit.showUpgrade || false,
        currentPlan: plan,
        limit: apiLimit.limit,
        remaining: apiLimit.remaining,
        resetAt: apiLimit.resetAt,
      },
      { status: apiLimit.status }
    )
  }

  try {
    const prompt = `Resume:\n${body.resumeText || 'N/A'}\n\nCompany: ${body.company}\nPosition: ${body.position}\nTone: ${body.tone || 'professional'}\n\nJob description:\n${body.jobDescription}`
    const generated = await askClaudeForJson(COVER_LETTER_SYSTEM_PROMPT, prompt)
    return NextResponse.json({ result: generated }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
