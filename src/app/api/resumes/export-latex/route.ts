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
}

type LatexExperienceEntry = {
  title?: string
  period?: string
  company?: string
  description?: string
  bullets?: unknown
}

type LatexDynamicSection = {
  type: string
  title?: string
  content?: string
}

type LatexResumeData = {
  personal?: LatexPersonal
  experience?: LatexExperienceEntry[]
  dynamicSections?: LatexDynamicSection[]
}

const MAX_EXPORT_PAYLOAD_CHARS = 250_000

function escapeLatex(text: string | undefined): string {
  if (!text) return ''
  return text
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

function generateLatex(data: LatexResumeData): string {
  const { personal, experience, dynamicSections = [] } = data

  const fullName = `${personal?.firstName || ''} ${personal?.lastName || ''}`.trim()
  
  // This is a simplified "Jake's Resume" style professional template in LaTeX
  let tex = `\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{} 
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\begin{document}

%----------HEADING-----------------
\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatex(fullName)}} \\\\ \\vspace{1pt}
    \\small ${escapeLatex(personal?.phone)} $|$ \\href{mailto:${escapeLatex(personal?.email)}}{\\underline{${escapeLatex(personal?.email)}}} $|$ ${escapeLatex(personal?.title)}
\\end{center}

`

  if (personal?.summary) {
    tex += `
\\section{Summary}
\\small{${escapeLatex(personal.summary)}}
`
  }

  if (experience && experience.length > 0) {
    tex += `
\\section{Experience}
  \\begin{itemize}[leftmargin=0.15in, label={}]
`
    for (const exp of experience) {
      const normalizedBullets = Array.isArray(exp.bullets)
        ? exp.bullets
            .map((bullet: unknown) => (typeof bullet === 'string' ? bullet.trim() : ''))
            .filter(Boolean)
        : []
      const safeBullets = normalizedBullets.length > 0
        ? normalizedBullets
        : [typeof exp.description === 'string' ? exp.description.trim() : ''].filter(Boolean)
      const bulletItems = safeBullets
        .map((bullet: string) => `        \\resumeItem{${escapeLatex(bullet)}}`)
        .join('\n')

      tex += `
    \\resumeSubheading
      {${escapeLatex(exp.title)}}{${escapeLatex(exp.period)}}
      {${escapeLatex(exp.company)}}{}
      \\begin{itemize}[leftmargin=0.15in, label={-}]
${bulletItems}
      \\end{itemize}
`
    }
    tex += `  \\end{itemize}
`
  }

  // Add dynamic sections mapped out
  const groupedSections = dynamicSections.reduce<Record<string, LatexDynamicSection[]>>((acc, current) => {
    if (!acc[current.type]) acc[current.type] = [];
    acc[current.type].push(current);
    return acc;
  }, {})

  for (const [type, sections] of Object.entries(groupedSections)) {
    const list = sections
    // Display section title from the first item of that type
    const sectionTitle = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
    
    tex += `\\section{${escapeLatex(sectionTitle)}}\n`
    if (type === 'education' || type === 'projects' || type === 'certifications') {
        tex += `  \\begin{itemize}[leftmargin=0.15in, label={}]\n`
        for (const section of list) {
             tex += `
    \\resumeSubheading
      {${escapeLatex(section.title)}}{ }
      {${escapeLatex(section.content)}}{ }
`
        }
        tex += `  \\end{itemize}\n`
    } else {
        for (const section of list) {
            tex += `\\textbf{${escapeLatex(section.title)}}: ${escapeLatex(section.content)} \\\\ \\vspace{2pt}\n`
        }
    }
  }

  tex += `
\\end{document}
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
    
    // Call the local LaTeX microservice running on Docker
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
      // Important to expect binary response
    })

    if (!response.ok) {
      let errStr = 'Failed to compile LaTeX'
      try {
        const errJson = (await response.json()) as { details?: string; error?: string }
        errStr = errJson.details || errJson.error || errStr
      } catch {}

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
        'Content-Disposition': 'inline; filename="resume.pdf"'
      }
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
