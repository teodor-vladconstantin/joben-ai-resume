import { describe, expect, it } from 'vitest'
import { extractTextFromPdf, PdfTextExtractError } from '@/lib/pdf-text-extract'

// Hand-built minimal single-page PDF (no xref table — pdf.js's brute-force
// object scan recovers it). Exists purely as a pdfjs-dist API smoke test:
// this file has zero fixtures, so a pdfjs-dist major-version bump (the
// getDocument()/PDFDocumentProxy/PDFDocumentLoadingTask surface this
// function relies on) could otherwise silently break at runtime with
// nothing failing in CI.
function buildMinimalPdf(text: string): Uint8Array {
  const streamContent = `BT /F1 24 Tf 20 100 Td (${text}) Tj ET`
  const streamLength = Buffer.byteLength(streamContent, 'latin1')

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 200 200] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
trailer
<< /Size 6 /Root 1 0 R >>
%%EOF`

  return new Uint8Array(Buffer.from(pdf, 'latin1'))
}

describe('extractTextFromPdf', () => {
  it('extracts text from a minimal single-page PDF', async () => {
    const pdf = buildMinimalPdf('Hello World')

    const text = await extractTextFromPdf(pdf)

    expect(text).toContain('Hello World')
  })

  it('rejects a non-PDF byte stream', async () => {
    const garbage = new Uint8Array(Buffer.from('not a pdf', 'utf-8'))

    await expect(extractTextFromPdf(garbage)).rejects.toBeInstanceOf(PdfTextExtractError)
  })
})
