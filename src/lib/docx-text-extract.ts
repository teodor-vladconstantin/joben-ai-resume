// Local, in-process DOCX text extraction via mammoth — same rationale as
// pdf-text-extract.ts: no external service call (the /api/parse pipeline is
// LlamaParse-backed and paid per document; anonymous traffic must not reach
// it), no structured field extraction, just raw text at zero marginal cost.
import mammoth from 'mammoth'

export class DocxTextExtractError extends Error {}

/**
 * Extracts plain text from a DOCX file. Never writes the file to disk —
 * everything happens on the in-memory byte array the caller passes in.
 */
export async function extractTextFromDocx(data: Uint8Array): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(data) })
    return result.value.replace(/[ \t]{2,}/g, ' ').trim()
  } catch (error) {
    throw new DocxTextExtractError(error instanceof Error ? error.message : 'Failed to extract text from DOCX')
  }
}
