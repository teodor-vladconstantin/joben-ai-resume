import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { trackProductEvent } from '@/lib/analytics'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { checkResumeExportQuota, getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'

export const runtime = 'nodejs'

type LatexPersonal = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  title?: string
  summary?: string
  linkedin?: string
  github?: string
}

type LatexExperienceEntry = {
  title?: string
  period?: string
  company?: string
  description?: string
  bullets?: unknown
}

type LatexProjectEntry = {
  name?: string
  role?: string
  period?: string
  description?: string
  bullets?: unknown
  technologies?: string[]
  url?: string
}

type LatexDynamicSection = {
  type: string
  title?: string
  content?: string
}

type LatexResumeData = {
  personal?: LatexPersonal
  experience?: LatexExperienceEntry[]
  projects?: LatexProjectEntry[]
  dynamicSections?: LatexDynamicSection[]
}

const MAX_EXPORT_PAYLOAD_CHARS = 250_000

function normalizeLatexText(text: string | undefined): string {
  if (!text) return ''

  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\t+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function clampLatexText(text: string | undefined, maxChars: number): string {
  const normalized = normalizeLatexText(text)
  if (normalized.length <= maxChars) return normalized

  const boundary = normalized.lastIndexOf(' ', maxChars)
  if (boundary > Math.floor(maxChars * 0.6)) {
    return `${normalized.slice(0, boundary).trimEnd()}...`
  }

  return `${normalized.slice(0, maxChars).trimEnd()}...`
}

function normalizeContactText(url: string): string {
  return normalizeLatexText(url).replace(/^https?:\/\/(www\.)?/i, '')
}

function makeLatexLink(url: string, label: string): string {
  return String.raw`\href{${normalizeLatexText(url)}}{${escapeLatex(label)}}`
}

function escapeLatex(text: string | undefined): string {
  const normalized = normalizeLatexText(text)
  if (!normalized) return ''

  const escaped = normalized
    .replace(/\\/g, '\\textbackslash ')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\~')
    .replace(/\^/g, '\\textasciicircum ')

  // Prevent overfull lines for very long unbroken strings (ids, hashes, accidental keyboard mash).
  return escaped.replace(/([A-Za-z0-9]{24})(?=[A-Za-z0-9])/g, '$1\\allowbreak{}')
}

function normalizeBulletCandidate(text: string): string {
  return clampLatexText(
    text
      .replace(/\*\*/g, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/^['"`]+|['"`]+$/g, ''),
    260
  )
}

function splitProjectDescription(description: string | undefined): string[] {
  const normalized = normalizeLatexText(description)
  if (!normalized) return []

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length > 1) return lines.slice(0, 6)

  const bulletSplit = normalized
    .split(/\s*[•·▪◦●○▸▶➤➢✓✔]\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (bulletSplit.length > 1) return bulletSplit.slice(0, 6)

  const sentenceSplit = normalized
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (sentenceSplit.length > 1 ? sentenceSplit : [normalized]).slice(0, 4)
}

function resolveProjectBullets(project: LatexProjectEntry): string[] {
  const fromBullets = Array.isArray(project.bullets)
    ? project.bullets
        .flatMap((bullet: unknown) => (typeof bullet === 'string' ? bullet.split(/\r?\n+/) : []))
        .map((bullet: string) => normalizeBulletCandidate(bullet))
        .filter((bullet: string) => Boolean(bullet) && /[\p{L}\p{N}]/u.test(bullet))
    : []

  if (fromBullets.length > 0) return fromBullets.slice(0, 8)

  return splitProjectDescription(project.description)
}

type ParsedEducationEntry = {
  institution: string
  details: string[]
}

function parseEducationContent(content: string | undefined): ParsedEducationEntry[] {
  const normalized = normalizeLatexText(content)
  if (!normalized) return []

  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks
    .map((block) => {
      const lines = block
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
      if (lines.length === 0) return null

      return {
        institution: lines[0],
        details: lines.slice(1),
      }
    })
    .filter((entry): entry is ParsedEducationEntry => Boolean(entry))
}

function extractSafeBullets(exp: LatexExperienceEntry): string[] {
  const fromBullets = Array.isArray(exp.bullets)
    ? exp.bullets
        .flatMap((bullet: unknown) => (typeof bullet === 'string' ? bullet.split(/\r?\n+/) : []))
        .map((bullet: string) => normalizeBulletCandidate(bullet))
        .filter((bullet: string) => Boolean(bullet) && /[\p{L}\p{N}]/u.test(bullet))
    : []

  if (fromBullets.length > 0) {
    return fromBullets
  }

  const fallback = normalizeBulletCandidate(typeof exp.description === 'string' ? exp.description : '')
  return fallback ? [fallback] : []
}

function generateLatex(data: LatexResumeData): string {
  const { personal, experience, dynamicSections = [] } = data

  const fullName = clampLatexText(`${personal?.firstName || ''} ${personal?.lastName || ''}`.trim(), 80)
  const contactParts = [
    personal?.phone ? escapeLatex(`Phone: ${clampLatexText(personal.phone, 40)}`) : '',
    personal?.email ? escapeLatex(`Email: ${clampLatexText(personal.email, 120)}`) : '',
    escapeLatex(clampLatexText(personal?.title, 90)),
    personal?.linkedin ? `LinkedIn: ${makeLatexLink(personal.linkedin, normalizeContactText(personal.linkedin))}` : '',
    personal?.github ? `GitHub: ${makeLatexLink(personal.github, normalizeContactText(personal.github))}` : '',
  ].filter(Boolean)
  const contactLine = contactParts.join(' $|$ ')
  const contactBlock = contactLine
    ? String.raw`    \small ${contactLine}
`
    : ''

  let tex = String.raw`\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{xurl}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}
\Urlmuskip=0mu plus 1mu

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}
\setlength{\emergencystretch}{3em}

% Sections formatting
\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabularx}{0.97\textwidth}[t]{@{}Xr@{}}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabularx}\vspace{-7pt}
}

\begin{document}

%----------HEADING-----------------
\begin{center}
    \textbf{\Huge \scshape ${escapeLatex(fullName)}} \\ \vspace{1pt}
${contactBlock}\end{center}

`

  if (personal?.summary) {
    tex += String.raw`
\section{Summary}
\small{${escapeLatex(clampLatexText(personal.summary, 900))}}
`
  }

  if (experience && experience.length > 0) {
    tex += String.raw`
\section{Experience}
  \begin{itemize}[leftmargin=0.15in, label={}]
`

    for (const exp of experience) {
      const safeBullets = extractSafeBullets(exp)
      const bulletItems = safeBullets
        .map((bullet: string) => String.raw`        \resumeItem{${escapeLatex(bullet)}}`)
        .join('\n')

      tex += String.raw`
    \resumeSubheading
      {${escapeLatex(clampLatexText(exp.title, 140))}}{${escapeLatex(clampLatexText(exp.period, 50))}}
      {${escapeLatex(clampLatexText(exp.company, 220))}}{}
      \begin{itemize}[leftmargin=0.15in, label={-}]
${bulletItems}
      \end{itemize}
`
    }

    tex += String.raw`  \end{itemize}
`
  }

  // Render projects section if present
  if (data.projects && data.projects.length > 0) {
    tex += String.raw`\section{Projects}
  \begin{itemize}[leftmargin=0.15in, label={}]
`
    for (const proj of data.projects) {
      const projTitle = escapeLatex(clampLatexText(proj.name || 'Project', 220))
      const projRole = escapeLatex(clampLatexText(proj.role || '', 140))
      const projPeriod = escapeLatex(clampLatexText(proj.period || '', 50))
      const projBullets = resolveProjectBullets(proj)
      const techs = proj.technologies && proj.technologies.length > 0
        ? escapeLatex(clampLatexText(proj.technologies.slice(0, 8).join(', '), 220))
        : ''

      const itemLines: string[] = []
      for (const bullet of projBullets) {
        itemLines.push(escapeLatex(clampLatexText(bullet, 900)))
      }
      if (techs) itemLines.push(String.raw`\textit{Technologies:} ${techs}`)
      if (proj.url) {
        itemLines.push(makeLatexLink(proj.url, normalizeContactText(proj.url)))
      }

      const projectItems = itemLines
        .map((line) => String.raw`        \resumeItem{${line}}`)
        .join('\n')

      // Subheading layout mirrors the Experience block so spacing stays consistent:
      //   Project name ............................. Period
      //   Role (italic) .............................(blank)
      tex += String.raw`
    \resumeSubheading
      {${projTitle}}{${projPeriod || ' '}}
      {${projRole || ' '}}{ }
`

      if (projectItems) {
        tex += String.raw`      \begin{itemize}[leftmargin=0.15in, label={-}]
${projectItems}
      \end{itemize}
`
      }
    }
    tex += String.raw`  \end{itemize}
`
  }

  const groupedSections = dynamicSections
    .filter((section) => section.type !== 'projects') // projects are now rendered separately
    .reduce<Record<string, LatexDynamicSection[]>>((acc, current) => {
    if (!acc[current.type]) acc[current.type] = []
    acc[current.type].push(current)
    return acc
  }, {})

  for (const [type, sections] of Object.entries(groupedSections)) {
    const sectionTitle = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')

    tex += String.raw`\section{${escapeLatex(sectionTitle)}}
`

    if (type === 'education' || type === 'certifications') {
      tex += String.raw`  \begin{itemize}[leftmargin=0.15in, label={}]
`
      for (const section of sections) {
        if (type === 'education') {
          const entries = parseEducationContent(section.content)
          if (entries.length > 0) {
            for (const entry of entries) {
              const details = entry.details.map((line) => escapeLatex(clampLatexText(line, 420))).join(' \\ ')
              tex += String.raw`
    \resumeSubheading
      {${escapeLatex(clampLatexText(entry.institution, 120))}}{ }
      {${details || ' '}}{ }
`
            }
            continue
          }
          // No structured entries — render the raw content directly without
          // leaking the (potentially-corrupt) section.title into the heading.
          const fallback = escapeLatex(clampLatexText(section.content, 900))
          if (fallback) {
            tex += String.raw`
    \resumeSubheading
      {${fallback}}{ }
      { }{ }
`
          }
          continue
        }

        tex += String.raw`
    \resumeSubheading
      {${escapeLatex(clampLatexText(section.title, 120))}}{ }
      {${escapeLatex(clampLatexText(section.content, 900))}}{ }
`
      }
      tex += String.raw`  \end{itemize}
`
    } else {
      for (const section of sections) {
        tex += String.raw`\textbf{${escapeLatex(clampLatexText(section.title, 120))}}: ${escapeLatex(clampLatexText(section.content, 1200))} \\ \vspace{2pt}
`
      }
    }
  }

  tex += String.raw`
\end{document}
`
  return tex
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)
    const plan = await getUserPlan(userId, emailHint)
    const quotaCheck = await checkResumeExportQuota(userId, plan)
    if (!quotaCheck.allowed) {
      return jsonWithRequestId(
        {
          error: quotaCheck.error || 'Could not validate export limits right now. Please try again.',
          showUpgrade: quotaCheck.showUpgrade || false,
          limit: quotaCheck.limit,
          used: quotaCheck.used,
          remaining: quotaCheck.remaining,
          currentPlan: plan,
        },
        quotaCheck.status,
        requestId
      )
    }

    const payload = await req.json()
    const { data } = payload

    if (!data) {
      return jsonWithRequestId({ error: 'Missing resume data' }, 400, requestId)
    }

    const serializedData = JSON.stringify(data)
    if (serializedData.length > MAX_EXPORT_PAYLOAD_CHARS) {
      return jsonWithRequestId(
        { error: 'Resume payload is too large to export.' },
        413,
        requestId
      )
    }

    const texStr = generateLatex(data)

    const latexServiceUrl = process.env.LATEX_SERVICE_URL || 'http://localhost:3005/api/compile'
    const latexServiceSecret = process.env.LATEX_SERVICE_SECRET
    const requireLatexServiceAuth = process.env.LATEX_SERVICE_AUTH_REQUIRED === 'true'
    const isProduction = process.env.NODE_ENV === 'production'

    if (requireLatexServiceAuth && !latexServiceSecret) {
      logger.error('LATEX_SERVICE_SECRET missing while latex auth is required', {
        requestId,
        route: '/api/resumes/export-latex',
        userId,
      })
      return jsonWithRequestId(
        { error: 'PDF export service is temporarily unavailable.' },
        503,
        requestId
      )
    }

    if (isProduction && !requireLatexServiceAuth && !latexServiceSecret) {
      logger.warn('LATEX_SERVICE_SECRET missing, continuing without latex auth', {
        requestId,
        route: '/api/resumes/export-latex',
        userId,
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (latexServiceSecret) {
      headers.Authorization = `Bearer ${latexServiceSecret}`
    }

    const response = await fetch(latexServiceUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tex: texStr }),
    })

    if (!response.ok) {
      let errStr = 'Failed to compile LaTeX'
      try {
        const errJson = (await response.json()) as { details?: string; error?: string }
        errStr = errJson.details || errJson.error || errStr
      } catch {
        // Keep generic message if JSON parse fails.
      }

      logger.error('LaTeX service compile failed', {
        requestId,
        route: '/api/resumes/export-latex',
        userId,
        error: errStr,
      })
      return jsonWithRequestId(
        { error: isProduction ? 'PDF export failed. Please try again later.' : errStr },
        500,
        requestId
      )
    }

    const pdfBuffer = await response.arrayBuffer()

    await trackProductEvent({
      userId,
      eventName: 'resume_exported_pdf',
      requestId,
      metadata: {
        dynamicSections: Array.isArray(data?.dynamicSections) ? data.dynamicSections.length : 0,
      },
    })

    const pdfResponse = new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="resume.pdf"',
      },
    })
    pdfResponse.headers.set('x-request-id', requestId)
    return pdfResponse
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error exporting to PDF'
    logger.error('Resume export route failed', {
      requestId,
      route: '/api/resumes/export-latex',
      error: message,
    })
    return jsonWithRequestId({ error: message }, 500, requestId)
  }
}
