import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractPdfText, mapGeminiResumeToTemplate, parseResumeWithGemini } from '@/lib/gemini-parser'

const MAX_PDF_IMPORTS = 3

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const resumeId = formData.get('resumeId') as string | null

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const text = await extractPdfText(buffer)

  if (!resumeId) {
    return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 })
  }

  const supabase = createServerClient()
  const { data: resume, error: selectError } = await supabase
    .from('resumes')
    .select('pdf_import_count')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single()

  if (selectError || !resume) {
    return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 })
  }

  const currentCount = typeof resume.pdf_import_count === 'number' ? resume.pdf_import_count : 0

  if (currentCount >= MAX_PDF_IMPORTS) {
    return NextResponse.json(
      { success: false, error: 'You have reached the maximum of 3 PDF imports for this resume.' },
      { status: 403 }
    )
  }

  let geminiResume
  try {
    geminiResume = await parseResumeWithGemini(text)
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Parsing service unavailable' }, { status: 503 })
  }

  const parsed = mapGeminiResumeToTemplate(geminiResume)

  const { error: updateError } = await supabase
    .from('resumes')
    .update({ pdf_import_count: currentCount + 1 })
    .eq('id', resumeId)
    .eq('user_id', userId)

  if (updateError) {
    return NextResponse.json({ success: false, error: 'Failed to update import count.' }, { status: 500 })
  }

  const pdf_imports_remaining = MAX_PDF_IMPORTS - (currentCount + 1)

  return NextResponse.json(
    { success: true, data: parsed, pdf_imports_remaining },
    { status: 200 }
  )
}
