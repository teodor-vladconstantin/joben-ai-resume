import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { apiError } from '@/lib/api-response'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { coverLetterPdfSchema } from '@/lib/validation/schemas'
import { getRequestId, logger } from '@/lib/logger'

export const runtime = 'nodejs'

// SECURITY: CLAUDE.md High #5 — cap PDF generation burst so a single user
// cannot saturate the Node runtime (react-pdf is CPU-bound).
const PDF_RATE_LIMIT_PER_HOUR = 20

type CoverLetterSections = {
  headerName?: string
  headerEmail?: string
  headerPhone?: string
  date?: string
  recipientName?: string
  recipientTitle?: string
  company?: string
  salutation?: string
  introduction?: string
  bodyParagraphs?: string[]
  conclusion?: string
  closingSignature?: string
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontSize: 11,
    color: '#0D2818',
    lineHeight: 1.6,
  },
  headerBlock: {
    marginBottom: 18,
  },
  paragraph: {
    marginBottom: 12,
  },
  bold: {
    fontSize: 12,
    fontWeight: 600,
  },
  sectionGap: {
    marginBottom: 16,
  },
})

function sanitizeFilename(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9-_ ]/g, '').trim()
  return cleaned.length > 0 ? cleaned : 'cover-letter'
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError(clientErrorMessage('auth'), 401)
    }

    const limit = await checkRouteRateLimit({
      name: 'cover-letter-pdf',
      identifier: resolveRateLimitIdentity(request, userId),
      limit: PDF_RATE_LIMIT_PER_HOUR,
      windowSeconds: 3600,
    })
    if (!limit.ok) {
      logger.warn('Cover letter PDF rate-limit hit', {
        requestId,
        route: '/api/cover-letter/pdf',
        userId,
        retryAfter: limit.retryAfter,
      })
      return new NextResponse(
        JSON.stringify({ error: clientErrorMessage('rate_limit') }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(limit.retryAfter),
            'x-request-id': requestId,
          },
        }
      )
    }

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return apiError(clientErrorMessage('invalid_input'), 400)
    }

    // SECURITY: Zod enforces paragraph cap (<=30), per-paragraph length
    // cap, and overall payload shape. Prevents storage / CPU abuse.
    const parsed = coverLetterPdfSchema.safeParse(rawBody)
    if (!parsed.success) {
      return apiError(clientErrorMessage('invalid_input'), 400)
    }

    const payload = parsed.data
    const title = payload.title || 'Cover Letter'
    const sections = (payload.sections || {}) as CoverLetterSections

    const bodyParagraphs =
      sections.bodyParagraphs?.map((item) => item.trim()).filter((item) => item.length > 0) || []

    const closingLines =
      sections.closingSignature
        ?.split('\n')
        .map((item) => item.trim())
        .filter((item) => item.length > 0) || []

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        React.createElement(
          View,
          { style: styles.headerBlock },
          React.createElement(Text, { style: styles.bold }, sections.headerName || 'Your Name'),
          sections.headerEmail ? React.createElement(Text, null, sections.headerEmail) : null,
          sections.headerPhone ? React.createElement(Text, null, sections.headerPhone) : null,
          React.createElement(Text, { style: { marginTop: 8 } }, sections.date || new Date().toLocaleDateString())
        ),
        React.createElement(
          View,
          { style: styles.sectionGap },
          sections.recipientName ? React.createElement(Text, null, sections.recipientName) : null,
          sections.recipientTitle ? React.createElement(Text, null, sections.recipientTitle) : null,
          sections.company ? React.createElement(Text, null, sections.company) : null
        ),
        React.createElement(Text, { style: styles.paragraph }, sections.salutation || 'Dear Hiring Manager,'),
        sections.introduction ? React.createElement(Text, { style: styles.paragraph }, sections.introduction) : null,
        ...bodyParagraphs.map((paragraph, index) =>
          React.createElement(Text, { key: `body-${index}`, style: styles.paragraph }, paragraph)
        ),
        sections.conclusion ? React.createElement(Text, { style: styles.paragraph }, sections.conclusion) : null,
        ...closingLines.map((line, index) =>
          React.createElement(Text, { key: `closing-${index}` }, line)
        )
      )
    )

    const blob = await pdf(doc).toBlob()
    const arrayBuffer = await blob.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(title)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    logger.error('Cover letter PDF route failed', {
      requestId,
      route: '/api/cover-letter/pdf',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}


