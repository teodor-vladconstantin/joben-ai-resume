"use client"
import { reconstructLines, parseResumeTextToData } from '@/lib/resume-parser'
import type { ResumeTemplateData } from '@/components/templates/types'

type PdfjsTextItem = {
  str: string
  transform?: number[]
}

export async function importPdfClientSide(file: File): Promise<ResumeTemplateData> {
  if (file.type !== 'application/pdf') throw new Error('File must be a PDF')
  if (file.size > 10 * 1024 * 1024) throw new Error('PDF must be under 10 MB')

  const pdfjsLib = await import('pdfjs-dist')

  // Use a local bundled worker to avoid CDN/CORS/network failures in browser.
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
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
