import { GoogleGenerativeAI } from '@google/generative-ai'
import { join } from 'path'
import type { ResumeDynamicSection, ResumeExperience, ResumeTemplateData } from '@/components/templates/types'
import { reconstructLines } from '@/lib/resume-parser'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { redis } from '@/lib/upstash'

type PdfjsTextItem = {
  str: string
  transform?: number[]
}

type GeminiPersonal = {
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  website: string
  summary: string
}

type GeminiExperience = {
  company: string
  role: string
  start_date: string
  end_date: string
  location: string
  bullets: string[]
}

type GeminiEducation = {
  institution: string
  degree: string
  field: string
  start_date: string
  end_date: string
  gpa: string
}

type GeminiLanguage = {
  language: string
  level: string
}

type GeminiCertification = {
  name: string
  issuer: string
  date: string
}

type GeminiProject = {
  name: string
  description: string
  technologies: string[]
  url: string
}

type GeminiResume = {
  personal: GeminiPersonal
  experience: GeminiExperience[]
  education: GeminiEducation[]
  skills: string[]
  languages: GeminiLanguage[]
  certifications: GeminiCertification[]
  projects: GeminiProject[]
  volunteer: string[]
  awards: string[]
}

const SYSTEM_INSTRUCTION = 'You are an expert resume parser. Extract ALL information from the resume text and return ONLY a valid JSON object. No markdown. No explanation. No preamble. No backticks.'

function buildUserMessage(pdfText: string): string {
  return [
    'Parse this resume and return JSON with this exact structure:',
    '{',
    '  "personal": {',
    '    "name": "",',
    '    "email": "",',
    '    "phone": "",',
    '    "location": "",',
    '    "linkedin": "",',
    '    "github": "",',
    '    "website": "",',
    '    "summary": ""',
    '  },',
    '  "experience": [',
    '    {',
    '      "company": "",',
    '      "role": "",',
    '      "start_date": "",',
    '      "end_date": "",',
    '      "location": "",',
    '      "bullets": []',
    '    }',
    '  ],',
    '  "education": [',
    '    {',
    '      "institution": "",',
    '      "degree": "",',
    '      "field": "",',
    '      "start_date": "",',
    '      "end_date": "",',
    '      "gpa": ""',
    '    }',
    '  ],',
    '  "skills": [],',
    '  "languages": [',
    '    {',
    '      "language": "",',
    '      "level": ""',
    '    }',
    '  ],',
    '  "certifications": [',
    '    {',
    '      "name": "",',
    '      "issuer": "",',
    '      "date": ""',
    '    }',
    '  ],',
    '  "projects": [',
    '    {',
    '      "name": "",',
    '      "description": "",',
    '      "technologies": [],',
    '      "url": ""',
    '    }',
    '  ],',
    '  "volunteer": [],',
    '  "awards": []',
    '}',
    'Rules:',
    '- Return ONLY the JSON object',
    '- Empty string for missing text fields',
    '- Empty array for missing array fields',
    '- Never invent information not in the resume',
    '- Keep dates exactly as written',
    '',
    'Resume text:',
    pdfText,
  ].join('\n')
}

const MODEL_NAME = 'gemini-2.0-flash-lite'
const MAX_OUTPUT_TOKENS = 4000
const REQUEST_TIMEOUT_MS = 30_000
const MAX_REQUESTS_PER_MINUTE = 60
const RATE_LIMIT_TTL_SECONDS = 90

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => toStringValue(item)).filter(Boolean)
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (isRecord(item)) {
        return Object.values(item)
          .map((entry) => toStringValue(entry))
          .filter(Boolean)
          .join(' | ')
      }
      return ''
    })
    .filter(Boolean)
}

function normalizePersonal(value: unknown): GeminiPersonal {
  const personal = isRecord(value) ? value : {}
  return {
    name: toStringValue(personal.name),
    email: toStringValue(personal.email),
    phone: toStringValue(personal.phone),
    location: toStringValue(personal.location),
    linkedin: toStringValue(personal.linkedin),
    github: toStringValue(personal.github),
    website: toStringValue(personal.website),
    summary: toStringValue(personal.summary),
  }
}

function normalizeExperience(value: unknown): GeminiExperience[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const entry = isRecord(item) ? item : {}
    return {
      company: toStringValue(entry.company),
      role: toStringValue(entry.role),
      start_date: toStringValue(entry.start_date),
      end_date: toStringValue(entry.end_date),
      location: toStringValue(entry.location),
      bullets: toStringArray(entry.bullets),
    }
  })
}

function normalizeEducation(value: unknown): GeminiEducation[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const entry = isRecord(item) ? item : {}
    return {
      institution: toStringValue(entry.institution),
      degree: toStringValue(entry.degree),
      field: toStringValue(entry.field),
      start_date: toStringValue(entry.start_date),
      end_date: toStringValue(entry.end_date),
      gpa: toStringValue(entry.gpa),
    }
  })
}

function normalizeLanguages(value: unknown): GeminiLanguage[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const entry = isRecord(item) ? item : {}
    return {
      language: toStringValue(entry.language),
      level: toStringValue(entry.level),
    }
  })
}

function normalizeCertifications(value: unknown): GeminiCertification[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const entry = isRecord(item) ? item : {}
    return {
      name: toStringValue(entry.name),
      issuer: toStringValue(entry.issuer),
      date: toStringValue(entry.date),
    }
  })
}

function normalizeProjects(value: unknown): GeminiProject[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const entry = isRecord(item) ? item : {}
    return {
      name: toStringValue(entry.name),
      description: toStringValue(entry.description),
      technologies: toStringArray(entry.technologies),
      url: toStringValue(entry.url),
    }
  })
}

function normalizeGeminiResume(value: unknown): GeminiResume {
  const root = isRecord(value) ? value : {}
  return {
    personal: normalizePersonal(root.personal),
    experience: normalizeExperience(root.experience),
    education: normalizeEducation(root.education),
    skills: toStringArray(root.skills),
    languages: normalizeLanguages(root.languages),
    certifications: normalizeCertifications(root.certifications),
    projects: normalizeProjects(root.projects),
    volunteer: normalizeStringList(root.volunteer),
    awards: normalizeStringList(root.awards),
  }
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const normalized = fullName.trim()
  if (!normalized) return { firstName: '', lastName: '' }

  const parts = normalized.split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0] || '', lastName: '' }
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1] || '',
  }
}

function formatPeriod(startDate: string, endDate: string): string {
  if (startDate && endDate) return `${startDate} - ${endDate}`
  return startDate || endDate || ''
}

function buildSection(id: string, type: ResumeDynamicSection['type'], title: string, content: string): ResumeDynamicSection {
  return {
    id,
    type,
    title,
    content,
  }
}

async function enforceGlobalRateLimit() {
  // Skip rate limit if Redis is not available
  if (!redis) {
    return
  }

  const minuteKey = Math.floor(Date.now() / 60000)
  const key = `gemini:global:minute:${minuteKey}`

  try {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_TTL_SECONDS)
    }

    if (count > MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Parser temporarily unavailable, try again in a minute')
    }
  } catch (error) {
    logger.warn('Gemini rate limit check failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error('Parser temporarily unavailable, try again in a minute')
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | null = null

  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('Gemini parsing failed'))
    }, timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')

  pdfjsLib.GlobalWorkerOptions.workerSrc = join(
    process.cwd(),
    'node_modules',
    'pdfjs-dist',
    'build',
    'pdf.worker.min.js'
  )

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const allLines: string[] = []

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    const items = (content.items as PdfjsTextItem[])
      .filter((item) => item.str.trim())
      .map((item) => ({
        str: item.str,
        x: item.transform?.[4] ?? 0,
        y: item.transform?.[5] ?? 0,
      }))

    allLines.push(...reconstructLines(items), '')
  }

  const lines = allLines.filter((line, index, arr) => line !== '' || arr[index - 1] !== '')
  const textContent = lines.filter(Boolean).join(' ')

  if (textContent.length < 50) {
    throw new Error('PDF appears to be a scanned image - text extraction is not possible')
  }

  return textContent
}

export async function parseResumeWithGemini(text: string): Promise<GeminiResume> {
  await enforceGlobalRateLimit()

  const apiKey = env.gemini.apiKey
  if (!apiKey) {
    throw new Error('Gemini parsing failed')
  }

  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_INSTRUCTION,
  })

  const userMessage = buildUserMessage(text)

  const result = await withTimeout(
    model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    }),
    REQUEST_TIMEOUT_MS
  )

  const responseText = result.response.text().trim()
  const cleanedText = responseText.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(cleanedText)
    return parsed as GeminiResume
  } catch (e) {
    throw new Error('Gemini returned invalid JSON')
  }
}

export function mapGeminiResumeToTemplate(resume: GeminiResume): ResumeTemplateData {
  const { firstName, lastName } = splitName(resume.personal.name)
  const baseId = Date.now()

  const personal: ResumeTemplateData['personal'] = {
    firstName,
    lastName,
    title: '',
    email: resume.personal.email,
    phone: resume.personal.phone,
    summary: resume.personal.summary,
  }

  if (resume.personal.location) personal.location = resume.personal.location
  if (resume.personal.linkedin) personal.linkedin = resume.personal.linkedin
  if (resume.personal.github) personal.github = resume.personal.github
  if (resume.personal.website) personal.website = resume.personal.website

  const experience: ResumeExperience[] = resume.experience.map((entry, index) => {
    const bullets = entry.bullets.map((bullet) => bullet.trim()).filter(Boolean)
    const description = bullets[0] || ''

    return {
      id: `exp_${baseId}_${index}`,
      title: entry.role,
      company: entry.company,
      period: formatPeriod(entry.start_date, entry.end_date),
      description,
      bullets,
    }
  })

  const dynamicSections: ResumeDynamicSection[] = []
  let sectionIndex = 0

  if (resume.education.length > 0) {
    const content = resume.education
      .map((entry) => {
        const parts = [
          entry.institution,
          [entry.degree, entry.field].filter(Boolean).join(' '),
          formatPeriod(entry.start_date, entry.end_date),
          entry.gpa ? `GPA: ${entry.gpa}` : '',
        ].filter(Boolean)
        return parts.join(' | ')
      })
      .filter(Boolean)
      .join('\n')

    if (content) {
      sectionIndex += 1
      dynamicSections.push(buildSection(`section_${baseId}_${sectionIndex}`, 'education', 'Education', content))
    }
  }

  if (resume.skills.length > 0) {
    const content = resume.skills.join(', ')
    if (content) {
      sectionIndex += 1
      dynamicSections.push(buildSection(`section_${baseId}_${sectionIndex}`, 'skills', 'Skills', content))
    }
  }

  if (resume.languages.length > 0) {
    const content = resume.languages
      .map((entry) => (entry.level ? `${entry.language} - ${entry.level}` : entry.language))
      .filter(Boolean)
      .join('\n')

    if (content) {
      sectionIndex += 1
      dynamicSections.push(buildSection(`section_${baseId}_${sectionIndex}`, 'languages', 'Languages', content))
    }
  }

  if (resume.certifications.length > 0) {
    const content = resume.certifications
      .map((entry) => [entry.name, entry.issuer, entry.date].filter(Boolean).join(' | '))
      .filter(Boolean)
      .join('\n')

    if (content) {
      sectionIndex += 1
      dynamicSections.push(buildSection(`section_${baseId}_${sectionIndex}`, 'certifications', 'Certifications', content))
    }
  }

  if (resume.projects.length > 0) {
    const content = resume.projects
      .map((entry) => {
        const parts = [
          entry.name,
          entry.description,
          entry.technologies.length > 0 ? `Tech: ${entry.technologies.join(', ')}` : '',
          entry.url,
        ].filter(Boolean)
        return parts.join(' | ')
      })
      .filter(Boolean)
      .join('\n')

    if (content) {
      sectionIndex += 1
      dynamicSections.push(buildSection(`section_${baseId}_${sectionIndex}`, 'projects', 'Projects', content))
    }
  }

  if (resume.volunteer.length > 0) {
    const content = resume.volunteer.join('\n')
    if (content) {
      sectionIndex += 1
      dynamicSections.push(buildSection(`section_${baseId}_${sectionIndex}`, 'volunteer', 'Volunteer', content))
    }
  }

  if (resume.awards.length > 0) {
    const content = resume.awards.join('\n')
    if (content) {
      sectionIndex += 1
      dynamicSections.push(buildSection(`section_${baseId}_${sectionIndex}`, 'awards', 'Awards', content))
    }
  }

  return {
    personal,
    experience,
    dynamicSections: dynamicSections.length > 0 ? dynamicSections : undefined,
  }
}
