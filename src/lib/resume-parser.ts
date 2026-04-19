import type { ResumeTemplateData, ResumeExperience, ResumeDynamicSection } from '@/components/templates/types'

// ─── Text extraction helpers ─────────────────────────────────────────────────

type TextItem = { str: string; x: number; y: number }

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s/&+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function reconstructLines(items: TextItem[]): string[] {
  if (items.length === 0) return []

  // Sort by y descending (top of page first), then x ascending
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)

  const lines: { y: number; parts: string[] }[] = []
  for (const item of sorted) {
    if (!item.str.trim()) continue
    const last = lines[lines.length - 1]
    // Items within 4 units of y are considered the same line
    if (last && Math.abs(last.y - item.y) < 4) {
      last.parts.push(item.str)
    } else {
      lines.push({ y: item.y, parts: [item.str] })
    }
  }

  return lines.map((l) => l.parts.join(' ').replace(/\s+/g, ' ').trim()).filter(Boolean)
}

// ─── Regex constants ──────────────────────────────────────────────────────────

const EMAIL_RE = /[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}/
const PHONE_RE = /(\+?\d[\d\s\-().]{6,}\d)/
const MONTH_RE_PART =
  '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ian|Febr?|Mar|Apr|Mai|Iun|Iul|Aug|Sep|Oct|Noi|Dec|Ianuarie|Februarie|Martie|Aprilie|Mai|Iunie|Iulie|August|Septembrie|Octombrie|Noiembrie|Decembrie)'
const DATE_RE = new RegExp(`(?:${MONTH_RE_PART}[a-zA-Zăâîșşțţ]*\\.?\\s+)?\\b\\d{4}\\b`, 'i')
const DATE_RANGE_RE = new RegExp(
  `(?:${MONTH_RE_PART}[a-zA-Zăâîșşțţ]*\\.?\\s+)?\\b\\d{4}\\b\\s*[–\\-—]\\s*(?:(?:${MONTH_RE_PART}[a-zA-Zăâîșşțţ]*\\.?\\s+)?\\b\\d{4}\\b|Present|Current|Now|Prezent|Actual|În\\s+prezent|In\\s+prezent)`,
  'i'
)
const BULLET_RE = /^\s*(?:[•·▸▶▪◦\-–—*]|(?:\d+|[a-zA-Z])[.)])\s+/
const SECTION_NAMES: Record<string, string> = {
  'experience': 'experience',
  'work experience': 'experience',
  'professional experience': 'experience',
  'employment': 'experience',
  'employment history': 'experience',
  'work history': 'experience',
  'career history': 'experience',
  'experienta': 'experience',
  'experienta profesionala': 'experience',
  'experienta de munca': 'experience',
  'istoric profesional': 'experience',
  'education': 'education',
  'academic background': 'education',
  'academic history': 'education',
  'educatie': 'education',
  'educatie si formare': 'education',
  'educatie & formare': 'education',
  'educatie si training': 'education',
  'studii': 'education',
  'studii si formare': 'education',
  'studii superioare': 'education',
  'formare academica': 'education',
  'education and training': 'education',
  'training': 'education',
  'courses': 'education',
  'coursework': 'education',
  'skills': 'skills',
  'technical skills': 'skills',
  'core competencies': 'skills',
  'competencies': 'skills',
  'technologies': 'skills',
  'tools & technologies': 'skills',
  'abilitati': 'skills',
  'competente': 'skills',
  'competente cheie': 'skills',
  'skill uri': 'skills',
  'projects': 'projects',
  'personal projects': 'projects',
  'side projects': 'projects',
  'key projects': 'projects',
  'proiecte': 'projects',
  'proiecte personale': 'projects',
  'proiecte relevante': 'projects',
  'portofoliu': 'projects',
  'certifications': 'certifications',
  'licenses': 'certifications',
  'licenses & certifications': 'certifications',
  'certificari': 'certifications',
  'cursuri si certificari': 'certifications',
  'atestate': 'certifications',
  'licente si certificari': 'certifications',
  'awards': 'awards',
  'honors': 'awards',
  'honors & awards': 'awards',
  'premii': 'awards',
  'publications': 'publications',
  'research': 'research',
  'publicatii': 'publications',
  'cercetare': 'research',
  'summary': 'summary',
  'professional summary': 'summary',
  'profile': 'summary',
  'about me': 'summary',
  'career objective': 'summary',
  'objective': 'summary',
  'overview': 'summary',
  'profil': 'summary',
  'profil profesional': 'summary',
  'sumar': 'summary',
  'obiectiv': 'summary',
  'obiectiv profesional': 'summary',
}

// ─── Section splitter ─────────────────────────────────────────────────────────

type Section = { type: string; title: string; lines: string[] }

function isSectionHeader(line: string): string | null {
  const cleaned = line.replace(/[:\-–—_|/\\]+$/, '').trim()
  const normalized = normalizeForMatch(cleaned)

  if (SECTION_NAMES[normalized]) return SECTION_NAMES[normalized]

  // All-caps line (3–40 chars, not a date, not all numbers)
  if (
    cleaned === cleaned.toUpperCase() &&
    cleaned.length >= 3 &&
    cleaned.length <= 40 &&
    /[A-Z\u00C0-\u024F]/.test(cleaned) &&
    !DATE_RE.test(cleaned)
  ) {
    const mapped = SECTION_NAMES[normalized]
    return mapped ?? `custom:${cleaned}`
  }

  return null
}

function splitIntoSections(lines: string[]): Section[] {
  const sections: Section[] = []
  let current: Section = { type: 'header', title: 'Header', lines: [] }

  for (const line of lines) {
    const sectionType = isSectionHeader(line)
    if (sectionType) {
      if (current.lines.length > 0) sections.push(current)
      const displayTitle =
        line.replace(/[:\-–—_|/\\]+$/, '').trim()
      current = { type: sectionType, title: displayTitle, lines: [] }
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.length > 0) sections.push(current)

  return sections
}

// ─── Personal info extraction ─────────────────────────────────────────────────

function extractPersonal(headerLines: string[]): ResumeTemplateData['personal'] {
  const allText = headerLines.join(' ')

  const email = allText.match(EMAIL_RE)?.[0] ?? ''
  const phone = allText.match(PHONE_RE)?.[0]?.trim() ?? ''

  // Name: first line that has 2–4 words, no digits, no email, no URL
  const nameLine = headerLines.find(
    (l) =>
      !l.includes('@') &&
      !/https?:\/\//.test(l) &&
      !PHONE_RE.test(l) &&
      !/\d{4}/.test(l) &&
      l.split(/\s+/).length >= 2 &&
      l.split(/\s+/).length <= 5 &&
      l.length >= 4 &&
      l.length <= 60
  )

  const nameParts = nameLine?.split(/\s+/) ?? []
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ')

  // Title: short line that looks like a job title (near the top, not contact info)
  const titleLine = headerLines.find(
    (l) =>
      l !== nameLine &&
      !l.includes('@') &&
      !PHONE_RE.test(l) &&
      !/https?:\/\//.test(l) &&
      !/\d{4}/.test(l) &&
      l.length >= 5 &&
      l.length <= 80 &&
      l.split(/\s+/).length >= 2 &&
      l.split(/\s+/).length <= 8
  )

  return {
    firstName,
    lastName,
    title: titleLine ?? '',
    email,
    phone,
    summary: '',
  }
}

// ─── Experience parser ────────────────────────────────────────────────────────

type DraftExperience = {
  title: string
  company: string
  period: string
  bullets: string[]
  notes: string[]
}

type PendingField = 'period' | 'title' | 'company' | 'responsibility'

const PERIOD_LINE_RE = /^(?:perioada|period(?:ul)?|period|employment\s+dates?|date(?:\s+range)?)\s*[:\-–—]?\s*(.*)$/i
const ROLE_LINE_RE = /^(?:func(?:t|ț)ia\/?postul\s+ocupat|func(?:t|ț)ie|functie|position|job\s+title|title|role|rol)\s*[:\-–—]?\s*(.*)$/i
const COMPANY_LINE_RE = /^(?:nume(?:le)?\s+s(?:i|î)\s+adresa\s+angajator(?:ului)?|nume\s+si\s+adresa\s+angajator(?:ului)?|company|employer|organization|angajator)\s*[:\-–—]?\s*(.*)$/i
const RESPONSIBILITY_LINE_RE = /^(?:activitate(?:a)?\s+principal[aă]|tipul\s+de\s+activitate|atributii|atribu(?:t|ț)ii|responsabilit(?:ati|ăți)|responsibilities?|key\s+achievements?|main\s+activities?)\s*[:\-–—]?\s*(.*)$/i
const LOOSE_DATE_RANGE_RE = /\b(19|20)\d{2}\b[^\n]{0,25}[–\-—][^\n]{0,25}(?:\b(19|20)\d{2}\b|present|current|now|prezent|actual|in\s+prezent|în\s+prezent)/i

function cleanFieldValue(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/^[|:;\-–—]+\s*/, '').trim()
}

function splitInlineBullets(text: string): string[] {
  const cleaned = cleanFieldValue(text).replace(BULLET_RE, '')
  if (!cleaned) return []

  const symbolParts = cleaned
    .split(/\s*[•·▸▶▪◦]\s*/)
    .map((part) => cleanFieldValue(part))
    .filter(Boolean)
  if (symbolParts.length > 1) return symbolParts

  const semicolonParts = cleaned
    .split(/\s*;\s*/)
    .map((part) => cleanFieldValue(part))
    .filter(Boolean)
  if (semicolonParts.length > 1) return semicolonParts

  return [cleaned]
}

function extractTaggedValue(line: string, pattern: RegExp): string | null {
  const match = line.match(pattern)
  if (!match) return null
  return cleanFieldValue(match[1] ?? '')
}

function hasJobContent(job: DraftExperience): boolean {
  return Boolean(
    job.title.trim() ||
    job.company.trim() ||
    job.period.trim() ||
    job.bullets.some((bullet) => bullet.trim()) ||
    job.notes.some((note) => note.trim())
  )
}

function buildExperienceFromDraft(job: DraftExperience, idx: number): ResumeExperience | null {
  const bullets = job.bullets.map((bullet) => cleanFieldValue(bullet)).filter(Boolean)
  const fallbackDescription = bullets[0] ?? job.notes.map((note) => cleanFieldValue(note)).find(Boolean) ?? ''

  if (!job.title && !job.company && !job.period && !fallbackDescription) return null

  return {
    id: `exp_${Date.now()}_${idx}`,
    title: job.title,
    company: job.company,
    period: job.period,
    description: fallbackDescription,
    bullets: bullets.length > 0 ? bullets : fallbackDescription ? [fallbackDescription] : [''],
  }
}

function isLikelyPeriodLine(line: string): boolean {
  const normalized = normalizeForMatch(line)
  const yearMatches = line.match(/\b(19|20)\d{2}\b/g) ?? []

  if (normalized === 'perioada' || normalized.startsWith('perioada ')) return true
  if (normalized === 'period' || normalized.startsWith('period ')) return true
  if (DATE_RANGE_RE.test(line) || LOOSE_DATE_RANGE_RE.test(line)) return true
  if (yearMatches.length >= 2 && /[–\-—]/.test(line)) return true
  if (yearMatches.length >= 1 && /(present|current|now|prezent|actual|in\s+prezent|în\s+prezent)/i.test(line)) return true

  return false
}

function looksLikeStandaloneJobTitle(line: string): boolean {
  if (line.length < 3 || line.length > 110) return false
  if (EMAIL_RE.test(line) || PHONE_RE.test(line) || DATE_RE.test(line)) return false
  if (/https?:\/\//i.test(line)) return false

  return /[A-Za-z\u00C0-\u024F]/.test(line)
}

function looksLikeCompanyLine(line: string): boolean {
  const normalized = normalizeForMatch(line)
  if (
    normalized.includes('company') ||
    normalized.includes('employer') ||
    normalized.includes('angajator') ||
    normalized.includes('administratia')
  ) {
    return true
  }

  return line.length <= 120 && !DATE_RE.test(line) && /,/.test(line)
}

function parseExperienceSection(lines: string[]): ResumeExperience[] {
  const jobs: ResumeExperience[] = []
  let expIndex = 0

  let current: DraftExperience = { title: '', company: '', period: '', bullets: [], notes: [] }
  let pendingField: PendingField | null = null

  const pushCurrent = () => {
    const built = buildExperienceFromDraft(current, expIndex)
    if (built) {
      jobs.push(built)
      expIndex += 1
    }
    current = { title: '', company: '', period: '', bullets: [], notes: [] }
    pendingField = null
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, ' ').trim()
    if (!line) continue
    if (isSectionHeader(line)) continue

    const periodValue = extractTaggedValue(line, PERIOD_LINE_RE)
    if (periodValue !== null) {
      if (hasJobContent(current) && (current.period || current.title || current.company || current.bullets.length > 0)) {
        pushCurrent()
      }

      if (periodValue) {
        current.period = periodValue
      } else {
        pendingField = 'period'
      }
      continue
    }

    const titleValue = extractTaggedValue(line, ROLE_LINE_RE)
    if (titleValue !== null) {
      if (titleValue) {
        if (current.title && hasJobContent(current) && current.period) pushCurrent()
        current.title = titleValue
      } else {
        pendingField = 'title'
      }
      continue
    }

    const companyValue = extractTaggedValue(line, COMPANY_LINE_RE)
    if (companyValue !== null) {
      if (companyValue) {
        current.company = companyValue
      } else {
        pendingField = 'company'
      }
      continue
    }

    const responsibilityValue = extractTaggedValue(line, RESPONSIBILITY_LINE_RE)
    if (responsibilityValue !== null) {
      if (responsibilityValue) {
        current.bullets.push(...splitInlineBullets(responsibilityValue))
      } else {
        pendingField = 'responsibility'
      }
      continue
    }

    if (pendingField) {
      if (pendingField === 'period') {
        if (current.period && hasJobContent(current)) pushCurrent()
        current.period = line
      } else if (pendingField === 'title') {
        current.title = line
      } else if (pendingField === 'company') {
        current.company = line
      } else {
        current.bullets.push(...splitInlineBullets(line))
      }

      pendingField = null
      continue
    }

    if (BULLET_RE.test(line)) {
      current.bullets.push(...splitInlineBullets(line.replace(BULLET_RE, '')))
      continue
    }

    if (isLikelyPeriodLine(line)) {
      if (current.period && hasJobContent(current)) {
        pushCurrent()
      }
      current.period = line
      continue
    }

    if (!current.title && looksLikeStandaloneJobTitle(line)) {
      current.title = line
      continue
    }

    if (!current.company && looksLikeCompanyLine(line)) {
      current.company = line
      continue
    }

    if (line.length >= 20) {
      current.bullets.push(...splitInlineBullets(line))
    } else {
      current.notes.push(line)
    }
  }

  pushCurrent()
  return jobs
}

// ─── Dynamic section builder ──────────────────────────────────────────────────

const SECTION_TYPE_MAP: Record<string, ResumeDynamicSection['type']> = {
  education: 'education',
  skills: 'skills',
  projects: 'projects',
  certifications: 'certifications',
  awards: 'awards',
  publications: 'publications',
  research: 'research',
}

type EducationField = 'period' | 'qualification' | 'field' | 'institution'

type EducationDraft = {
  period: string
  qualification: string
  field: string
  institution: string
  details: string[]
}

const EDU_PERIOD_PREFIX_RE = /^(?:perioada|period(?:ul)?|period|dates?)\s*[:\-–—]?\s*(.*)$/i
const EDU_PERIOD_SUFFIX_RE = /^(.*?)\s+(?:perioada|period(?:ul)?|period|dates?)\s*$/i
const EDU_QUAL_PREFIX_RE = /^(?:calific(?:area)?\/?diploma\s+ob(?:t|ț|ţ)inut[ăa]?|calific(?:are|area)|diploma|degree|qualification)\s*[:\-–—]?\s*(.*)$/i
const EDU_QUAL_SUFFIX_RE = /^(.*?)\s+(?:calific(?:area)?\/?diploma\s+ob(?:t|ț|ţ)inut[ăa]?|calific(?:are|area)|diploma|degree|qualification)\s*$/i
const EDU_FIELD_PREFIX_RE = /^(?:disciplinele\s+studiate|specializare(?:a)?|field\s+of\s+study|major)\s*[:\-–—]?\s*(.*)$/i
const EDU_FIELD_SUFFIX_RE = /^(.*?)\s+(?:disciplinele\s+studiate|specializare(?:a)?|field\s+of\s+study|major)\s*$/i
const EDU_INSTITUTION_PREFIX_RE = /^(?:numele?\s+institu(?:t|ț|ţ)iei\s+de\s+inv(?:a|ă)t(?:a|ă)m(?:a|â)nt|institu(?:t|ț|ţ)ia\s+de\s+inv(?:a|ă)t(?:a|ă)m(?:a|â)nt|institution|university|school|college)\s*[:\-–—]?\s*(.*)$/i
const EDU_INSTITUTION_SUFFIX_RE = /^(.*?)\s+(?:numele?\s+institu(?:t|ț|ţ)iei\s+de\s+inv(?:a|ă)t(?:a|ă)m(?:a|â)nt|institu(?:t|ț|ţ)ia\s+de\s+inv(?:a|ă)t(?:a|ă)m(?:a|â)nt|institution|university|school|college)\s*$/i

function extractPrefixOrSuffixValue(line: string, prefix: RegExp, suffix: RegExp): string | null {
  const prefixMatch = line.match(prefix)
  if (prefixMatch) return cleanFieldValue(prefixMatch[1] ?? '')

  const suffixMatch = line.match(suffix)
  if (suffixMatch) return cleanFieldValue(suffixMatch[1] ?? '')

  return null
}

function hasEducationContent(entry: EducationDraft): boolean {
  return Boolean(
    entry.period.trim() ||
    entry.qualification.trim() ||
    entry.field.trim() ||
    entry.institution.trim() ||
    entry.details.some((item) => item.trim())
  )
}

function formatEducationEntry(entry: EducationDraft): string {
  const heading = cleanFieldValue(entry.qualification || entry.institution || 'Education')
  const period = cleanFieldValue(entry.period)
  const titleLine = period ? `${heading} (${period})` : heading

  const bullets: string[] = []
  const seen = new Set<string>()

  const pushUniqueBullet = (value: string) => {
    const cleaned = cleanFieldValue(value)
    if (!cleaned) return
    const key = normalizeForMatch(cleaned)
    if (!key || seen.has(key)) return
    seen.add(key)
    bullets.push(cleaned)
  }

  if (entry.institution && normalizeForMatch(entry.institution) !== normalizeForMatch(heading)) {
    pushUniqueBullet(`Institution: ${entry.institution}`)
  }

  if (entry.field) {
    pushUniqueBullet(`Field of study: ${entry.field}`)
  }

  for (const detail of entry.details) {
    splitInlineBullets(detail).forEach(pushUniqueBullet)
  }

  return [titleLine, ...bullets.map((item) => `• ${item}`)].join('\n')
}

function formatEducationSectionContent(lines: string[]): string {
  const entries: string[] = []
  let current: EducationDraft = {
    period: '',
    qualification: '',
    field: '',
    institution: '',
    details: [],
  }
  let pendingField: EducationField | null = null

  const pushCurrent = () => {
    if (!hasEducationContent(current)) return
    entries.push(formatEducationEntry(current))
    current = { period: '', qualification: '', field: '', institution: '', details: [] }
    pendingField = null
  }

  for (const rawLine of lines) {
    const line = cleanFieldValue(rawLine)
    if (!line || isSectionHeader(line)) continue

    const periodValue = extractPrefixOrSuffixValue(line, EDU_PERIOD_PREFIX_RE, EDU_PERIOD_SUFFIX_RE)
    if (periodValue !== null) {
      if (hasEducationContent(current) && (current.period || current.qualification || current.institution || current.details.length > 0)) {
        pushCurrent()
      }

      if (periodValue) {
        current.period = periodValue
      } else {
        pendingField = 'period'
      }
      continue
    }

    const qualificationValue = extractPrefixOrSuffixValue(line, EDU_QUAL_PREFIX_RE, EDU_QUAL_SUFFIX_RE)
    if (qualificationValue !== null) {
      if (qualificationValue) {
        current.qualification = qualificationValue
      } else {
        pendingField = 'qualification'
      }
      continue
    }

    const fieldValue = extractPrefixOrSuffixValue(line, EDU_FIELD_PREFIX_RE, EDU_FIELD_SUFFIX_RE)
    if (fieldValue !== null) {
      if (fieldValue) {
        current.field = fieldValue
      } else {
        pendingField = 'field'
      }
      continue
    }

    const institutionValue = extractPrefixOrSuffixValue(line, EDU_INSTITUTION_PREFIX_RE, EDU_INSTITUTION_SUFFIX_RE)
    if (institutionValue !== null) {
      if (institutionValue) {
        current.institution = institutionValue
      } else {
        pendingField = 'institution'
      }
      continue
    }

    if (pendingField) {
      current[pendingField] = line
      pendingField = null
      continue
    }

    if (BULLET_RE.test(line)) {
      current.details.push(...splitInlineBullets(line))
      continue
    }

    if (isLikelyPeriodLine(line)) {
      if (current.period && hasEducationContent(current)) {
        pushCurrent()
      }
      current.period = line
      continue
    }

    if (!current.qualification && looksLikeStandaloneJobTitle(line)) {
      current.qualification = line
      continue
    }

    if (
      !current.institution &&
      (looksLikeCompanyLine(line) || /(universit|academy|facult|liceu|school|college|institut)/i.test(line))
    ) {
      current.institution = line
      continue
    }

    current.details.push(line)
  }

  pushCurrent()
  if (entries.length === 0) return lines.join('\n')
  return entries.join('\n\n')
}

function formatSkillsSectionContent(lines: string[]): string {
  const skills = new Map<string, string>()

  for (const rawLine of lines) {
    const line = cleanFieldValue(rawLine)
    if (!line || isSectionHeader(line)) continue

    const bulletParts = splitInlineBullets(line)
    const parts: string[] = []

    for (const part of bulletParts) {
      const commaParts = part
        .split(/\s*[,;|]\s*/)
        .map((item) => cleanFieldValue(item))
        .filter(Boolean)

      if (commaParts.length > 1) {
        parts.push(...commaParts)
      } else {
        parts.push(part)
      }
    }

    for (const item of parts) {
      const cleaned = cleanFieldValue(item)
      const key = normalizeForMatch(cleaned)
      if (!key || skills.has(key)) continue
      skills.set(key, cleaned)
    }
  }

  if (skills.size === 0) return lines.join('\n')
  return Array.from(skills.values()).map((item) => `• ${item}`).join('\n')
}

function formatGenericSectionContent(lines: string[]): string {
  const paragraphs: string[] = []
  let current: string[] = []

  const pushCurrent = () => {
    const compact = current.map((item) => cleanFieldValue(item)).filter(Boolean)
    if (compact.length > 0) paragraphs.push(compact.join('\n'))
    current = []
  }

  for (const rawLine of lines) {
    const line = cleanFieldValue(rawLine)
    if (!line || isSectionHeader(line)) continue

    if (BULLET_RE.test(line)) {
      splitInlineBullets(line).forEach((item) => current.push(`• ${item}`))
      continue
    }

    const inlineBulletParts = splitInlineBullets(line)
    if (inlineBulletParts.length > 1) {
      inlineBulletParts.forEach((item) => current.push(`• ${item}`))
      continue
    }

    if (isLikelyPeriodLine(line) && current.length > 0) {
      pushCurrent()
      current.push(line)
      continue
    }

    if (
      line === line.toUpperCase() &&
      /[A-Z\u00C0-\u024F]/.test(line) &&
      current.length > 0
    ) {
      pushCurrent()
      current.push(line)
      continue
    }

    current.push(line)
  }

  pushCurrent()
  if (paragraphs.length === 0) return lines.join('\n')
  return paragraphs.join('\n\n')
}

function formatDynamicSectionContent(section: Section, type: ResumeDynamicSection['type']): string {
  const lines = section.lines.map((line) => cleanFieldValue(line)).filter(Boolean)
  if (lines.length === 0) return ''

  if (type === 'education') return formatEducationSectionContent(lines)
  if (type === 'skills') return formatSkillsSectionContent(lines)
  return formatGenericSectionContent(lines)
}

function buildDynamicSection(section: Section, idx: number): ResumeDynamicSection {
  const baseType = section.type.startsWith('custom:') ? 'leadership' : section.type
  const type = (SECTION_TYPE_MAP[baseType] ?? 'leadership') as ResumeDynamicSection['type']

  return {
    id: `section_${type}_${idx}`,
    type,
    title: section.title,
    content: formatDynamicSectionContent(section, type),
  }
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseResumeTextToData(lines: string[]): ResumeTemplateData {
  const sections = splitIntoSections(lines)

  const headerSection = sections.find((s) => s.type === 'header') ?? { lines: lines.slice(0, 6) }
  const personal = extractPersonal(headerSection.lines)

  // Summary section → personal.summary
  const summarySection = sections.find((s) => s.type === 'summary')
  if (summarySection) {
    personal.summary = summarySection.lines.join(' ').trim()
  }

  // Experience sections
  const experienceSections = sections.filter((s) => s.type === 'experience')
  const experience = experienceSections.flatMap((section) => parseExperienceSection(section.lines))

  // All other sections → dynamicSections
  const skipTypes = new Set(['header', 'experience', 'summary'])
  const dynamicSections: ResumeDynamicSection[] = sections
    .filter((s) => !skipTypes.has(s.type) && s.lines.length > 0)
    .map((s, i) => buildDynamicSection(s, i))

  return { personal, experience, dynamicSections }
}
