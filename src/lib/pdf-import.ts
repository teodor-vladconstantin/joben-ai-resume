"use client"
import { reconstructLines, parseResumeTextToData } from '@/lib/resume-parser'
import type { ResumeTemplateData } from '@/components/templates/types'

type PdfjsTextItem = {
  str: string
  transform?: number[]
}

/**
 * Import a PDF resume.
 *
 * Strategy (in order):
 *   1. POST to /api/parse-resume → Python microservice (PyMuPDF + spaCy + BERT)
 *      Best accuracy; multi-column, Europass, ESCO skills.
 *   2. Client-side TypeScript parser (pdfjs-dist + heuristics)
 *      Always available fallback — no network dependency.
 */
export async function importPdfClientSide(file: File): Promise<ResumeTemplateData> {
  if (file.type !== 'application/pdf') throw new Error('File must be a PDF')
  if (file.size > 10 * 1024 * 1024) throw new Error('PDF must be under 10 MB')

  // ── Layer 1: Python microservice ─────────────────────────────────────────
  try {
    const result = await _importViaPythonService(file)
    if (result) return result
  } catch {
    // Service unreachable or timed out — fall through to TypeScript parser
  }

  // ── Layer 2: TypeScript parser (client-side, always available) ───────────
  return _importWithTsParser(file)
}

// ─────────────────────────────────────────────────────────────────────────────

async function _importViaPythonService(file: File): Promise<ResumeTemplateData | null> {
  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 18_000)

  let response: Response
  try {
    response = await fetch('/api/parse-resume', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    console.warn('[pdf-import] Python service returned', response.status, '— falling back to TS parser')
    return null
  }

  const data = (await response.json()) as ResumeTemplateData

  // Sanity check: Python service must return at least a name or email
  const hasMinimalData =
    data.personal?.firstName ||
    data.personal?.lastName  ||
    data.personal?.email     ||
    (data.experience?.length ?? 0) > 0

  if (!hasMinimalData) {
    console.warn('[pdf-import] Python service returned empty result — falling back to TS parser')
    return null
  }

  return data
}

async function _importWithTsParser(file: File): Promise<ResumeTemplateData> {
  const pdfjsLib = await import('pdfjs-dist')

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise

  const allLines: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    const items = (content.items as PdfjsTextItem[])
      .filter((item) => item.str.trim())
      .map((item) => ({
        str: item.str,
        x: item.transform?.[4] ?? 0,
        y: item.transform?.[5] ?? 0,
      }))

    allLines.push(...reconstructLines(items), '')
  }

  const lines = allLines.filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
  const textContent = lines.filter(Boolean).join(' ')

  if (textContent.length < 50) {
    throw new Error('PDF appears to be a scanned image — text extraction is not possible')
  }

  return parseResumeTextToData(lines)
}
