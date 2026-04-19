import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

export const runtime = 'nodejs'

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
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: { title?: string; sections?: CoverLetterSections }
  try {
    payload = (await request.json()) as { title?: string; sections?: CoverLetterSections }
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  }

  const title = payload.title || 'Cover Letter'
  const sections = payload.sections || {}

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
}


