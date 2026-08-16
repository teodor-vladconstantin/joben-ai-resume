// Local, in-process PDF text extraction via pdfjs-dist — deliberately NOT
// the resume-parser microservice used by /api/parse (that pipeline calls
// LlamaParse, a paid per-document API — routing anonymous, unauthenticated
// traffic through it would put a metered third-party cost behind an
// unauthenticated endpoint). This only extracts raw text, no structured
// fields (name/dates/etc) — enough for an ATS score, at zero marginal cost.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api'

export class PdfTextExtractError extends Error {}

// Resumes are 1-3 pages; cap generously above that so a malformed/huge PDF
// can't turn one request into minutes of page-by-page extraction.
const MAX_PAGES = 10

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item && typeof item.str === 'string'
}

/**
 * Extracts plain text from a PDF's pages. Never writes the file to disk —
 * everything happens on the in-memory byte array the caller passes in.
 */
export async function extractTextFromPdf(data: Uint8Array): Promise<string> {
  const loadingTask = getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
    verbosity: 0,
  })

  let doc
  try {
    doc = await loadingTask.promise
  } catch (error) {
    throw new PdfTextExtractError(error instanceof Error ? error.message : 'Failed to load PDF')
  }

  try {
    const pageCount = Math.min(doc.numPages, MAX_PAGES)
    const chunks: string[] = []

    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i)
      try {
        const content = await page.getTextContent()
        chunks.push(content.items.filter(isTextItem).map((item) => item.str).join(' '))
      } finally {
        page.cleanup()
      }
    }

    return chunks.join('\n').replace(/[ \t]{2,}/g, ' ').trim()
  } finally {
    await doc.destroy()
  }
}
