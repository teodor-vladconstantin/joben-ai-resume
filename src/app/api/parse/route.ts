import { NextRequest, NextResponse } from 'next/server'

const PARSER_URL = process.env.RESUME_PARSER_URL || 'http://resume-parser:8001'

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  let response: Response
  try {
    response = await fetch(`${PARSER_URL}/parse`, {
      method: 'POST',
      body: formData,
    })
  } catch {
    return NextResponse.json({ detail: 'Resume parser service unavailable' }, { status: 503 })
  }

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function GET() {
  try {
    const response = await fetch(`${PARSER_URL}/health`)
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ detail: 'Resume parser service unavailable' }, { status: 503 })
  }
}
