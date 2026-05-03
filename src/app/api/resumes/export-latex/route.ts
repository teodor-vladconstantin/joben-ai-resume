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
  description?: string
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
    .replace(/\s+/g, ' ')
    .trim()
}

function clampLatexText(text: string | undefined, maxChars: number): string {
  return normalizeLatexText(text).slice(0, maxChars)
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

  return normalized
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
      const projTitle = escapeLatex(clampLatexText(proj.name || 'Project', 120))
      const projDesc = proj.description ? escapeLatex(clampLatexText(proj.description, 280)) : ''
      const techs = proj.technologies && proj.technologies.length > 0
        ? escapeLatex(proj.technologies.slice(0, 5).join(', '))
        : ''
      
      let projContent = projDesc
      if (techs) {
        projContent += (projContent ? ' • ' : '') + `Technologies: ${techs}`
      }
      if (proj.url) {
        const link = makeLatexLink(proj.url, normalizeContactText(proj.url))
        projContent += (projContent ? ' • ' : '') + link
      }

      tex += String.raw`
    \resumeSubheading
      {${projTitle}}{ }
      {${projContent}}{ }
`
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
        tex += String.raw`
    \resumeSubheading
      {${escapeLatex(clampLatexText(section.title, 120))}}{ }
      {${escapeLatex(clampLatexText(section.content, 260))}}{ }
`
      }
      tex += String.raw`  \end{itemize}
`
    } else {
      for (const section of sections) {
        tex += String.raw`\textbf{${escapeLatex(clampLatexText(section.title, 120))}}: ${escapeLatex(clampLatexText(section.content, 520))} \\ \vspace{2pt}
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
