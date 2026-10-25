import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToBuffer, Document, Page, Text, View } from '@react-pdf/renderer'
import { extractTextFromPdf } from '@/lib/pdf-text-extract'

const h = React.createElement

// Real PDF with letter-spaced headings and a two-column experience row, the
// layout that produced "E D U C A T I O N" and scrambled roles in production.
async function buildCv(): Promise<Uint8Array> {
  const doc = h(Document, null, h(Page, { size: 'A4', style: { padding: 30, fontSize: 11 } },
    h(Text, { style: { fontSize: 18, letterSpacing: 6 } }, 'EDUCATION'),
    h(Text, null, 'Bachelor of Arts, University of Bucharest 2018 - 2021'),
    h(Text, { style: { fontSize: 14, letterSpacing: 5, marginTop: 12 } }, 'WORK EXPERIENCE'),
    h(View, { style: { flexDirection: 'row', marginTop: 6 } },
      h(View, { style: { width: '35%' } }, h(Text, null, 'Sales Associate'), h(Text, null, 'Jan 2022 - Present')),
      h(View, { style: { width: '65%' } }, h(Text, null, 'Handled 40 customers daily and trained 5 new hires.')))))
  return new Uint8Array(await renderToBuffer(doc))
}

describe('extractTextFromPdf on a real letter-spaced PDF', () => {
  it('returns whole words for tracked headings and keeps the role text', async () => {
    const text = await extractTextFromPdf(await buildCv())
    expect(text).toContain('EDUCATION')
    expect(text).toContain('WORK EXPERIENCE')
    expect(text).not.toMatch(/E D U C A T I O N/)
    expect(text).toContain('Sales Associate')
    expect(text).toContain('Handled 40 customers daily and trained 5 new hires.')
  })
})
