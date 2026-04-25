import { NextRequest, NextResponse } from 'next/server'
import type { ResumeTemplateData, ResumeDynamicSection } from '@/components/templates/types'

const PARSER_URL = process.env.PARSER_SERVICE_URL ?? 'http://localhost:3002'
const PARSE_TIMEOUT_MS = 20_000

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 })
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PARSE_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(`${PARSER_URL}/parse`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[parse-resume] Python parser error:', response.status, errorText)
      return NextResponse.json({ error: 'Failed to parse resume.' }, { status: response.status })
    }

    // Python service response is already shaped as ResumeTemplateData
    const raw = await response.json()
    const data: ResumeTemplateData = mapPythonResponse(raw)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Parser service timed out.' }, { status: 504 })
    }
    console.error('[parse-resume] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// ── Response mapping ──────────────────────────────────────────────────────────
// The Python service and the TypeScript parser share the same output schema,
// so this is mostly a pass-through with defensive defaults.

function mapPythonResponse(raw: Record<string, unknown>): ResumeTemplateData {
  const personal = (raw.personal as Record<string, unknown>) ?? {}
  const experience = Array.isArray(raw.experience) ? raw.experience : []
  const dynamicSections = Array.isArray(raw.dynamicSections) ? raw.dynamicSections : []

  return {
    personal: {
      firstName:  String(personal.firstName  ?? ''),
      lastName:   String(personal.lastName   ?? ''),
      title:      String(personal.title      ?? ''),
      email:      String(personal.email      ?? ''),
      phone:      String(personal.phone      ?? ''),
      summary:    String(personal.summary    ?? ''),
      ...(personal.location  ? { location:  String(personal.location)  } : {}),
      ...(personal.linkedin  ? { linkedin:  String(personal.linkedin)  } : {}),
      ...(personal.github    ? { github:    String(personal.github)    } : {}),
      ...(personal.website   ? { website:   String(personal.website)   } : {}),
    },
    experience: experience.map((e: Record<string, unknown>) => ({
      id:          String(e.id          ?? crypto.randomUUID()),
      title:       String(e.title       ?? ''),
      company:     String(e.company     ?? ''),
      period:      String(e.period      ?? ''),
      description: String(e.description ?? ''),
      bullets:     Array.isArray(e.bullets) ? e.bullets.map(String) : [],
    })),
    dynamicSections: dynamicSections.map((s: Record<string, unknown>): ResumeDynamicSection => ({
      id:      String(s.id      ?? crypto.randomUUID()),
      type:    String(s.type    ?? 'leadership'),
      title:   String(s.title   ?? ''),
      content: String(s.content ?? ''),
    })),
  }
}
