import type { ResumeTemplateData } from '@/components/templates/types'

type ParseResumeResponse = {
  success?: boolean
  error?: string
  full_name?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  linkedin?: string | null
  github?: string | null
  work_experience?: Array<{
    company: string | null
    role: string | null
    start_date: string | null
    end_date: string | null
    start_month?: number | null
    start_year?: number | null
    end_month?: number | null
    end_year?: number | null
    is_current?: boolean
    description: string | null
    bullets?: string[] | null
  }>
  education?: Array<{
    institution: string | null
    degree: string | null
    field: string | null
    start_date: string | null
    end_date: string | null
    start_month?: number | null
    start_year?: number | null
    end_month?: number | null
    end_year?: number | null
  }>
  skills?: string[]
  languages?: Array<{
    language: string
    level: string
  }>
  certifications?: string[]
  projects?: Array<{
    name?: string | null
    role?: string | null
    description?: string | null
    bullets?: string[] | null
    technologies?: string[] | null
    url?: string | null
    start_date?: string | null
    end_date?: string | null
    start_month?: number | null
    start_year?: number | null
    end_month?: number | null
    end_year?: number | null
  }>
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

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatSingleDate(value: string | null | undefined): string {
  if (!value) return ''
  const cleaned = decodeHtml(value).trim()
  if (!cleaned) return ''
  if (/^(present|current|ongoing|now)$/i.test(cleaned)) return 'Present'

  const yearMonthMatch = cleaned.match(/^(\d{4})-(\d{2})$/)
  if (yearMonthMatch) {
    const monthIdx = Number(yearMonthMatch[2]) - 1
    if (monthIdx >= 0 && monthIdx < MONTH_LABELS.length) {
      return `${MONTH_LABELS[monthIdx]} ${yearMonthMatch[1]}`
    }
  }

  return cleaned
}

function formatDateRange(start: string | null, end: string | null): string {
  const startLabel = formatSingleDate(start)
  const endLabel = formatSingleDate(end)

  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`
  if (startLabel) return `${startLabel} - Present`
  return ''
}

function splitCombinedBullet(value: string): string[] {
  const cleaned = value.trim()
  if (!cleaned) return []

  // Newlines are the strongest signal: each becomes its own bullet.
  const newlineSplit = cleaned.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean)
  if (newlineSplit.length > 1) return newlineSplit

  // Split on inline bullet characters embedded in the string
  const bulletSplit = cleaned.split(/\s*[•·▪◦●○▸▶➤➢✓✔]\s+/)
  if (bulletSplit.length > 1) return bulletSplit.map((s) => s.trim()).filter(Boolean)

  // Split on numbered list items embedded in a single string (e.g. "1. Built X 2. Improved Y")
  const numberedSplit = cleaned.split(/(?<!\d)\d{1,2}[.)]\s+/)
  if (numberedSplit.length > 1) {
    const parts = numberedSplit.map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1) return parts
  }

  // Split on sentence boundaries (capital letter after punctuation)
  const sentenceSplit = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((item) => item.trim())
    .filter(Boolean)
  return sentenceSplit.length > 1 ? sentenceSplit : [cleaned]
}

function normalizeExperienceBullets(input: string[] | null | undefined, description: string): string[] {

  if (Array.isArray(input)) {
    const cleaned = input.map((item) => decodeHtml(item).trim()).filter(Boolean)
    if (cleaned.length === 1) return splitCombinedBullet(cleaned[0])
    if (cleaned.length > 0) return cleaned
  }

  const fallback = decodeHtml(description || '')
  if (!fallback) return []
  const split = fallback
    .split(/\n|•|●|▪|◦/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (split.length > 1) return split
  return splitCombinedBullet(fallback)
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

  const projects = parsed.projects || []
  const projectsArray = Array.isArray(projects) && projects.length > 0
    ? projects.map((p, i) => {
        const rawDescription = p.description ? decodeHtml(p.description) : ''
        const incomingBullets = Array.isArray(p.bullets) && p.bullets.length > 0
          ? p.bullets.map((bullet) => decodeHtml(bullet).trim()).filter(Boolean)
          : []
        // Fall back to splitting the description into bullets so the builder + LaTeX export
        // render clean line items instead of a single wall of text.
        const resolvedBullets = incomingBullets.length > 0
          ? incomingBullets
          : rawDescription ? splitCombinedBullet(rawDescription) : []
        // Store description as one bullet per line so the builder textarea reflects the
        // structured bullets and the user can freely edit them.
        const descriptionForBuilder = resolvedBullets.length > 0
          ? resolvedBullets.join('\n')
          : rawDescription

        return {
          id: `proj_${Date.now()}_${i}`,
          name: p.name ? decodeHtml(p.name) : `Project ${i + 1}`,
          role: p.role ? decodeHtml(p.role) : '',
          description: descriptionForBuilder,
          bullets: resolvedBullets,
          technologies: Array.isArray(p.technologies) ? p.technologies.map((t) => decodeHtml(t)) : [],
          url: p.url ? decodeHtml(p.url) : undefined,
          period: formatDateRange(p.start_date ?? null, p.end_date ?? null),
          startMonth: p.start_month ?? undefined,
          startYear: p.start_year ?? undefined,
          endMonth: p.end_month ?? undefined,
          endYear: p.end_year ?? undefined,
          isCurrent: typeof p.end_date === 'string'
            ? /^(present|current|ongoing|now)$/i.test(p.end_date.trim())
            : false,
        }
      })
    : []

  return {
    personal: {
      firstName,
      lastName,
      title: '',
      email: decodeHtml(parsed.email),
      phone: decodeHtml(parsed.phone),
      summary: decodeHtml(parsed.summary),
      location: decodeHtml(parsed.location) || undefined,
      linkedin: decodeHtml(parsed.linkedin) || undefined,
      github: decodeHtml(parsed.github) || undefined,
    },
    experience: (parsed.work_experience || []).map((exp, i) => ({
      id: `exp_${Date.now()}_${i}`,
      title: decodeHtml(exp.role),
      company: decodeHtml(exp.company),
      period: formatDateRange(exp.start_date, exp.end_date),
      startMonth: exp.start_month ?? undefined,
      startYear: exp.start_year ?? undefined,
      endMonth: exp.end_month ?? undefined,
      endYear: exp.end_year ?? undefined,
      isCurrent: exp.is_current ?? false,
      description: decodeHtml(exp.description),
      bullets: normalizeExperienceBullets(exp.bullets, exp.description || ''),
    })),
    projects: projectsArray,
    dynamicSections,
  }
}

export async function importPdfClientSide(file: File): Promise<PdfImportResult> {
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  const allowedExtensions = ['.pdf', '.docx']
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  const hasAllowedExtension = allowedExtensions.includes(extension)
  const hasAllowedType = file.type ? allowedTypes.includes(file.type) : false
  if (!hasAllowedExtension && !hasAllowedType) {
    throw new Error('File must be a PDF or DOCX')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File must be under 5 MB')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/parse', {
    method: 'POST',
    body: formData,
  })

  const payload = (await response.json()) as ParseResumeResponse | { error?: string; detail?: string }
  if (!response.ok) {
    const message =
      (payload as { error?: string; detail?: string }).error ||
      (payload as { error?: string; detail?: string }).detail ||
      'Resume parsing failed. Please try again.'
    throw new Error(message)
  }

  return { data: mapLlamaParseToTemplate(payload as ParseResumeResponse) }
}
