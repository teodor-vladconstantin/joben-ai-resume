"use client"
import type { ResumeTemplateData } from '@/components/templates/types'

type PdfjsTextItem = {
  str: string
  transform?: number[]
}

export async function importPdfClientSide(file: File): Promise<ResumeTemplateData> {
  if (file.type !== 'application/pdf') throw new Error('File must be a PDF')
  if (file.size > 10 * 1024 * 1024) throw new Error('PDF must be under 10 MB')

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/parse-resume', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to parse PDF.')
  }

  const data = await response.json()
  return data as ResumeTemplateData
}
