import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { trackProductEvent } from '@/lib/analytics'
import { capturePostHogEvent } from '@/lib/posthog-server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { checkResumeExportQuota, getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { renderInlineLatex } from '@/lib/inline-format'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { exportLatexSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

// SECURITY: burst-protect the external LaTeX compile microservice the same
// way /api/cover-letter/pdf protects react-pdf — monthly quotas alone don't
// stop a fast client-side loop within a single billing period.
const EXPORT_LATEX_RATE_LIMIT_PER_HOUR = 20

type LatexPersonal = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  title?: string
  summary?: string
  linkedin?: string
  github?: string
  website?: string
  location?: string
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

type LatexEducationEntry = {
  id?: string
  institution?: string
  degree?: string
  field?: string
  location?: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent?: boolean
  description?: string
}

type LatexResumeData = {
  personal?: LatexPersonal
  experience?: LatexExperienceEntry[]
  projects?: LatexProjectEntry[]
  education?: LatexEducationEntry[]
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

// Mirror `HarvardTemplate` validation: LinkedIn/GitHub/website inputs often
// contain placeholder copy like "LinkedIn Link" or
// "https://github.com/yourusername". Render those as nothing instead of
// emitting a broken `\href`.
const PLACEHOLDER_URL_TOKENS = /yourusername|placeholder|example\.com/i

function looksLikeUrl(value: string | undefined | null): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed) return false
  if (PLACEHOLDER_URL_TOKENS.test(trimmed)) return false
  if (/^https?:\/\//i.test(trimmed)) return true
  return /^([\w-]+\.)+[a-z]{2,}(\/|$)/i.test(trimmed)
}

function normalizeHref(value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

// Escapes LaTeX-special characters only — no whitespace normalization. Used
// both for whole strings (via `escapeLatex`, after normalizing once) and for
// individual inline-format segments (via `escapeLatexFormatted`), where
// re-normalizing per segment would trim the space right at a bold/italic
// boundary and glue adjacent words together.
function escapeLatexChars(text: string): string {
  const escaped = text
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

function escapeLatex(text: string | undefined): string {
  const normalized = normalizeLatexText(text)
  if (!normalized) return ''
  return escapeLatexChars(normalized)
}

function normalizeBulletCandidate(text: string): string {
  // Keep inline-format markers (**bold**, *italic*, __underline__) so the
  // LaTeX renderer can translate them — strip only stray leading bullet
  // glyphs and outer quotes the user did not intend to keep.
  return clampLatexText(
    text
      // Require whitespace after the glyph so we do not eat the leading
      // asterisk of an *italic* marker.
      .replace(/^[-*•]\s+/, '')
      .replace(/^['"`]+|['"`]+$/g, ''),
    260
  )
}

function escapeLatexFormatted(text: string | undefined): string {
  const normalized = normalizeLatexText(text)
  if (!normalized) return ''
  return renderInlineLatex(normalized, (segment) => escapeLatexChars(segment))
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

const LATEX_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatLatexEducationPeriod(entry: LatexEducationEntry): string {
  const startLabel = entry.startYear
    ? entry.startMonth
      ? `${LATEX_MONTH_LABELS[entry.startMonth - 1]} ${entry.startYear}`
      : `${entry.startYear}`
    : ''
  const endLabel = entry.isCurrent
    ? 'Present'
    : entry.endYear
      ? entry.endMonth
        ? `${LATEX_MONTH_LABELS[entry.endMonth - 1]} ${entry.endYear}`
        : `${entry.endYear}`
      : ''

  if (startLabel && endLabel) return `${startLabel} -- ${endLabel}`
  if (startLabel) return startLabel
  if (endLabel) return endLabel
  return ''
}

function buildLatexEducationDegreeLine(entry: LatexEducationEntry): string {
  return [entry.degree, entry.field].map((part) => (part || '').trim()).filter(Boolean).join(', ')
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
  const linkedinUrl = looksLikeUrl(personal?.linkedin) ? normalizeHref(personal!.linkedin!) : null
  const githubUrl = looksLikeUrl(personal?.github) ? normalizeHref(personal!.github!) : null
  const websiteUrl = looksLikeUrl(personal?.website) ? normalizeHref(personal!.website!) : null
  const titleText = clampLatexText(personal?.title, 90)
  // Render the professional title on its own line (matches the Harvard web
  // preview which stacks name, uppercase title, and contact line).
  const titleBlock = titleText
    ? String.raw`    {\scshape\large ${escapeLatex(titleText)}} \\ \vspace{2pt}
`
    : ''
  const contactParts = [
    personal?.phone ? escapeLatex(`Phone: ${clampLatexText(personal.phone, 40)}`) : '',
    personal?.email ? escapeLatex(`Email: ${clampLatexText(personal.email, 120)}`) : '',
    personal?.location ? escapeLatex(clampLatexText(personal.location, 80)) : '',
    linkedinUrl ? `LinkedIn: ${makeLatexLink(linkedinUrl, normalizeContactText(linkedinUrl))}` : '',
    githubUrl ? `GitHub: ${makeLatexLink(githubUrl, normalizeContactText(githubUrl))}` : '',
    websiteUrl ? makeLatexLink(websiteUrl, normalizeContactText(websiteUrl)) : '',
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
    \textbf{\Huge \scshape ${escapeLatex(fullName)}} \\ \vspace{4pt}
${titleBlock}${contactBlock}\end{center}

`

  if (personal?.summary) {
    tex += String.raw`
\section{Summary}
\small{${escapeLatexFormatted(clampLatexText(personal.summary, 900))}}
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
        .map((bullet: string) => String.raw`        \resumeItem{${escapeLatexFormatted(bullet)}}`)
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
        itemLines.push(escapeLatexFormatted(clampLatexText(bullet, 900)))
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

  // Render structured education entries first. When present, we suppress any
  // legacy `dynamicSections[type=education]` blocks below so the same data is
  // not printed twice.
  const structuredEducation = (data.education || []).filter((entry) => (entry.institution || '').trim())
  if (structuredEducation.length > 0) {
    tex += String.raw`\section{Education}
  \begin{itemize}[leftmargin=0.15in, label={}]
`
    for (const entry of structuredEducation) {
      const institution = escapeLatex(clampLatexText(entry.institution || '', 160))
      const period = escapeLatex(formatLatexEducationPeriod(entry))
      const degreeLine = escapeLatex(clampLatexText(buildLatexEducationDegreeLine(entry), 220))
      const location = escapeLatex(clampLatexText(entry.location || '', 120))
      const description = escapeLatexFormatted(clampLatexText(entry.description || '', 600))

      tex += String.raw`
    \resumeSubheading
      {${institution}}{${period || ' '}}
      {${degreeLine || ' '}}{${location || ' '}}
`
      if (description) {
        tex += String.raw`      \begin{itemize}[leftmargin=0.15in, label={-}]
        \resumeItem{${description}}
      \end{itemize}
`
      }
    }
    tex += String.raw`  \end{itemize}
`
  }

  const groupedSections = dynamicSections
    .filter((section) => section.type !== 'projects') // projects are now rendered separately
    .filter((section) => !(structuredEducation.length > 0 && section.type === 'education'))
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
          const fallback = escapeLatexFormatted(clampLatexText(section.content, 900))
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
      {${escapeLatexFormatted(clampLatexText(section.content, 900))}}{ }
`
      }
      tex += String.raw`  \end{itemize}
`
    } else {
      for (const section of sections) {
        tex += String.raw`\textbf{${escapeLatex(clampLatexText(section.title, 120))}}: ${escapeLatexFormatted(clampLatexText(section.content, 1200))} \\ \vspace{2pt}
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

    const rateLimit = await checkRouteRateLimit({
      name: 'resumes-export-latex',
      identifier: resolveRateLimitIdentity(req, userId),
      limit: EXPORT_LATEX_RATE_LIMIT_PER_HOUR,
      windowSeconds: 3600,
    })
    if (!rateLimit.ok) {
      logger.warn('Resume LaTeX export rate-limit hit', {
        requestId,
        route: '/api/resumes/export-latex',
        userId,
        retryAfter: rateLimit.retryAfter,
      })
      return jsonWithRequestId(
        { error: clientErrorMessage('rate_limit'), retryAfter: rateLimit.retryAfter },
        429,
        requestId
      )
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

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsedBody = exportLatexSchema.safeParse(rawBody)
    if (!parsedBody.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const { data } = parsedBody.data

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
    const isProduction = process.env.NODE_ENV === 'production'
    // SECURITY: CLAUDE.md Medium #3 — auth on the LaTeX upstream stays
    // opt-in (matches the upstream service default). Operators can flip
    // LATEX_SERVICE_AUTH_REQUIRED=true to make a missing secret hard-fail
    // here. We always emit a loud warning in prod when the upstream is
    // unauthenticated so the gap is visible in monitoring.
    const requireLatexServiceAuth = process.env.LATEX_SERVICE_AUTH_REQUIRED === 'true'

    if (requireLatexServiceAuth && !latexServiceSecret) {
      logger.error('LATEX_SERVICE_SECRET missing while LATEX_SERVICE_AUTH_REQUIRED=true', {
        requestId,
        route: '/api/resumes/export-latex',
        userId,
      })
      return jsonWithRequestId(
        { error: clientErrorMessage('unavailable', 'PDF export service is temporarily unavailable.') },
        503,
        requestId
      )
    }

    if (isProduction && !latexServiceSecret) {
      logger.warn('LaTeX upstream is being called without a shared secret', {
        requestId,
        route: '/api/resumes/export-latex',
        hint: 'Set LATEX_SERVICE_SECRET on Vercel and on the LaTeX container (with REQUIRE_SERVICE_AUTH=true) to authenticate every compile.',
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (latexServiceSecret) {
      headers.Authorization = `Bearer ${latexServiceSecret}`
    }

    // SECURITY: CLAUDE.md Medium #4 — bound the upstream call so a stuck
    // LaTeX compile cannot hold this request handler open indefinitely.
    const latexController = new AbortController()
    const latexTimeout = setTimeout(() => latexController.abort(), 20_000)
    let response: Response
    try {
      response = await fetch(latexServiceUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tex: texStr }),
        signal: latexController.signal,
      })
    } catch (fetchError) {
      logger.error('LaTeX service request failed', {
        requestId,
        route: '/api/resumes/export-latex',
        userId,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
      })
      return jsonWithRequestId(
        { error: clientErrorMessage('unavailable', 'PDF export service is temporarily unavailable.') },
        503,
        requestId
      )
    } finally {
      clearTimeout(latexTimeout)
    }

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
      // SECURITY: never leak the LaTeX service error (may contain file
      // paths, tex source snippets, stack traces). Dev mode keeps the detail
      // so debugging is still possible locally.
      return jsonWithRequestId(
        {
          error: isProduction
            ? clientErrorMessage('server', 'PDF export failed. Please try again later.')
            : errStr,
        },
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

    // Only one template exists today ('harvard'); hardcoded until the schema gains a template_id field.
    await capturePostHogEvent({
      distinctId: userId,
      event: 'pdf_exported',
      properties: { template_id: 'harvard' },
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
    logger.error('Resume export route failed', {
      requestId,
      route: '/api/resumes/export-latex',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
