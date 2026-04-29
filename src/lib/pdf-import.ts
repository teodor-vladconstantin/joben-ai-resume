import type { ResumeTemplateData } from '@/components/templates/types'

type ParseResumeResponse = {
  success?: boolean
  error?: string
  parsed?: ResumeTemplateData
  pdf_import_count?: number
  pdf_imports_remaining?: number
  data?: {
    parsed?: ResumeTemplateData
    pdf_import_count?: number
    pdf_imports_remaining?: number
  }
}

export type PdfImportResult = {
  data: ResumeTemplateData
  pdfImportCount: number | null
  pdfImportsRemaining: number | null
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export async function importPdfClientSide(file: File, resumeId?: string | null): Promise<PdfImportResult> {
  if (file.type !== 'application/pdf') throw new Error('File must be a PDF')
  if (file.size > 10 * 1024 * 1024) throw new Error('PDF must be under 10 MB')

  const formData = new FormData()
  formData.append('file', file)
  if (resumeId) {
    formData.append('resumeId', resumeId)
  }

  const response = await fetch('/api/parse-resume', {
    method: 'POST',
    body: formData,
  })

  const payload = (await response.json()) as ParseResumeResponse
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || 'PDF import failed. Please try again.')
  }

  const parsed = payload.data?.parsed ?? payload.parsed
  if (!parsed) {
    throw new Error('PDF import failed. Please try again.')
  }

  const pdfImportCount = toNumber(payload.data?.pdf_import_count ?? payload.pdf_import_count)
  const pdfImportsRemaining = toNumber(payload.data?.pdf_imports_remaining ?? payload.pdf_imports_remaining)

  return {
    data: parsed,
    pdfImportCount,
    pdfImportsRemaining,
  }
}
