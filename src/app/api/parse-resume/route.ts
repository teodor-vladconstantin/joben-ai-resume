import { NextRequest, NextResponse } from 'next/server'
import { parsePdfBuffer } from '@/lib/parse-pdf-server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const data = await parsePdfBuffer(buffer)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[parse-resume] TypeScript parser error:', error)
    return NextResponse.json({ error: 'Failed to parse resume.' }, { status: 500 })
  }
}
