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
    company: string | null
    role: string | null
    start_date: string | null
    end_date: string | null
    description: string | null
  }>
  education?: Array<{
    institution: string | null
    degree: string | null
    field: string | null
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

function decodeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/&#x26;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function parseName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' }
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  const lastName = parts.pop() || ''
  return { firstName: parts.join(' '), lastName }
}

function formatDateRange(start: string | null, end: string | null): string {
  if (start && end) return `${start} - ${end}`
  if (start) return `${start} - Present`
  return ''
}

function mapLlamaParseToTemplate(parsed: ParseResumeResponse): ResumeTemplateData {
  const { firstName, lastName } = parseName(parsed.full_name)
  const dynamicSections = []

  const education = parsed.education || []
  if (education.length > 0) {
    const content = education
      .map((edu) => {
        const parts = [decodeHtml(edu.institution)]
        if (edu.degree || edu.field) {
          parts.push([decodeHtml(edu.degree), decodeHtml(edu.field)].filter(Boolean).join(', '))
        }
        const period = formatDateRange(edu.start_date, edu.end_date)
        if (period) parts.push(period)
        return parts.join('\n')
      })
      .join('\n\n')
    dynamicSections.push({ id: `edu_${Date.now()}`, type: 'education', title: 'Education', content })
  }

  const skills = parsed.skills || []
  if (skills.length > 0) {
    dynamicSections.push({
      id: `skills_${Date.now()}`,
      type: 'skills',
      title: 'Skills',
      content: skills.map(decodeHtml).join(', '),
    })
  }

  const languages = parsed.languages || []
  if (languages.length > 0) {
    dynamicSections.push({
      id: `lang_${Date.now()}`,
      type: 'languages',
      title: 'Languages',
      content: languages.map((l) => `${decodeHtml(l.language)}${l.level ? ` (${decodeHtml(l.level)})` : ''}`).join(', '),
    })
  }

  const certifications = parsed.certifications || []
  if (certifications.length > 0) {
    dynamicSections.push({
      id: `cert_${Date.now()}`,
      type: 'certifications',
      title: 'Certifications',
      content: certifications.map(decodeHtml).join('\n'),
    })
  }

  return {
    personal: {
      firstName,
      lastName,
      title: '',
      email: decodeHtml(parsed.email),
      phone: decodeHtml(parsed.phone),
      summary: decodeHtml(parsed.summary),
      location: decodeHtml(parsed.location) || undefined,
    },
    experience: (parsed.work_experience || []).map((exp, i) => ({
      id: `exp_${Date.now()}_${i}`,
      title: decodeHtml(exp.role),
      company: decodeHtml(exp.company),
      period: formatDateRange(exp.start_date, exp.end_date),
      description: decodeHtml(exp.description),
      bullets: exp.description ? [decodeHtml(exp.description)] : [],
    })),
    dynamicSections,
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

  const response = await fetch('/api/parse', {
    method: 'POST',
    body: formData,
  })

  const payload = (await response.json()) as ParseResumeResponse | { error: string }
  if (!response.ok) {
    throw new Error((payload as { error: string }).error || 'Resume parsing failed. Please try again.')
  }

  return { data: mapLlamaParseToTemplate(payload as ParseResumeResponse) }
}
