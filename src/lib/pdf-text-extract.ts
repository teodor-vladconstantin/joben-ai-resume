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

// A gap wider than this share of the glyph height counts as a word space.
const WORD_GAP_RATIO = 0.15

/**
 * Joins pdfjs text items in stream order, deciding spaces and line breaks from
 * item positions. Appending a space after every item turned letter-spaced
 * headings (one item per glyph) into "E D U C A T I O N".
 */
export function itemsToText(items: TextItem[]): string {
  let out = ''
  let prev: TextItem | null = null
  let atLineStart = true

  for (const item of items) {
    if (prev && !atLineStart) {
      const size = Math.max(item.height, prev.height, 1)
      const sameLine = Math.abs(item.transform[5] - prev.transform[5]) <= size * 0.5
      // Right-to-left runs advance toward smaller x: the gap is between the
      // previous item's left edge and this item's right edge.
      const gap =
        item.dir === 'rtl'
          ? prev.transform[4] - (item.transform[4] + item.width)
          : item.transform[4] - (prev.transform[4] + prev.width)
      if (!sameLine) {
        out += '\n'
      } else if (gap > size * WORD_GAP_RATIO && !out.endsWith(' ')) {
        out += ' '
      }
    }
    // Per item, so the space item between two tracked words survives.
    out += mergeSpacedLetters(item.str)
    if (item.hasEOL) {
      out += '\n'
      atLineStart = true
    } else {
      atLineStart = false
    }
    if (item.str !== '') prev = item
  }
  return out
}

const isLower = (ch: string) => ch === ch.toLowerCase() && ch !== ch.toUpperCase()
const isUpper = (ch: string) => ch === ch.toUpperCase() && ch !== ch.toLowerCase()

// Safety net for tracked headings that still arrive as "E D U C A T I O N":
// 4+ single letters separated by single spaces become one word. A lowercase
// letter followed by an uppercase one is a word boundary, so
// "S a l e s A s s o c i a t e" becomes "Sales Associate".
// ponytail: an all-caps tracked run with no case change ("S K I L L S W O R K",
// one space between the words) still fuses; the per-item merging in itemsToText
// keeps the usual case (a separate space item) apart.
export function mergeSpacedLetters(text: string): string {
  return text.replace(/(?<![\p{L}\p{N}])(?:\p{L} ){3,}\p{L}(?![\p{L}\p{N}])/gu, (run) => {
    const letters = run.split(' ')
    return letters.reduce(
      (word, letter, i) => (i > 0 && isLower(letters[i - 1]) && isUpper(letter) ? `${word} ${letter}` : word + letter),
      ''
    )
  })
}

/**
 * Extracts plain text from a PDF's pages. Never writes the file to disk —
 * everything happens on the in-memory byte array the caller passes in.
 */
export async function extractTextFromPdf(data: Uint8Array): Promise<string> {
  // pdfjs-dist 6.x dropped `isEvalSupported` entirely (no more eval-based JS
  // execution path in the worker), so there's nothing left to opt out of here.
  const loadingTask = getDocument({
    data,
    useWorkerFetch: false,
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
        // Keep pdfjs line breaks so bullets/sections stay distinguishable.
        chunks.push(itemsToText(content.items.filter(isTextItem)))
      } finally {
        page.cleanup()
      }
    }

    // Merge before collapsing spaces: a double space is the word gap that keeps
    // "W O R K  E X P E R I E N C E" from fusing into one word.
    return mergeSpacedLetters(chunks.join('\n')).replace(/[ \t]{2,}/g, ' ').trim()
  } finally {
    // pdfjs-dist 6.x moved destroy() from PDFDocumentProxy to the loading task.
    await loadingTask.destroy()
  }
}
