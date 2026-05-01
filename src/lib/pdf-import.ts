import type { ResumeTemplateData } from '@/components/templates/types'

type ParseResumeResponse = {
  success?: boolean
  error?: string
  full_name?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  work_experience?: Array<{
    company: string
    role: string
    start_date: string | null
    end_date: string | null
    description: string | null
  }>
  education?: Array<{
    institution: string
    degree: string
    field: string
    start_date: string | null
    end_date: string | null
  }>
  skills?: string[]
  languages?: Array<{
    language: string
    level: string
  }>
  certifications?: string[]
}

export type PdfImportResult = {
  data: ResumeTemplateData
}

function parseName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' }
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  const lastName = parts.pop() || ''
  const firstName = parts.join(' ')
  return { firstName, lastName }
}

function formatDateRange(start_date: string | null, end_date: string | null): string {
  const start = start_date ? start_date : ''
  const end = end_date ? end_date : 'Present'
  if (start && end) return `${start} - ${end}`
  if (start) return `${start} - Present`
  return ''
}

function mapLlamaParseToTemplate(parsed: ParseResumeResponse): ResumeTemplateData {
  const { firstName, lastName } = parseName(parsed.full_name)

  return {
    personal: {
      firstName,
      lastName,
      title: '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      summary: parsed.summary || '',
      location: parsed.location,
      linkedin: undefined,
      github: undefined,
      website: undefined,
    },
    experience: (parsed.work_experience || []).map((exp, i) => ({
      id: `exp_${Date.now()}_${i}`,
      title: exp.role,
      company: exp.company,
      period: formatDateRange(exp.start_date, exp.end_date),
      description: exp.description || '',
      bullets: exp.description ? [exp.description] : [],
    })),
  }
}

export async function importPdfClientSide(file: File): Promise<PdfImportResult> {
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be a PDF or DOCX')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File must be under 5 MB')
  }

  const formData = new FormData()
  formData.append('file', file)

  const microserviceUrl = process.env.NEXT_PUBLIC_RESUME_PARSER_URL || 'http://localhost:8001'
  const response = await fetch(`${microserviceUrl}/parse`, {
    method: 'POST',
    body: formData,
  })

  const payload = (await response.json()) as ParseResumeResponse | { error: string }
  if (!response.ok) {
    throw new Error((payload as { error: string }).error || 'Resume parsing failed. Please try again.')
  }

  const parsed = mapLlamaParseToTemplate(payload as ParseResumeResponse)

  return {
    data: parsed,
  }
}
