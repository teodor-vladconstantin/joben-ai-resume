import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { hasExpectedSignature } from '@/lib/security/file-signature'
import { extractTextFromPdf, PdfTextExtractError } from '@/lib/pdf-text-extract'
import { extractTextFromDocx, DocxTextExtractError } from '@/lib/docx-text-extract'
import { analyzeResumeTextLightweight } from '@/lib/ats-fast-parser'
import { capturePostHogEvent, toBrowserDistinctId } from '@/lib/posthog-server'

export const runtime = 'nodejs'
export const maxDuration = 15

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx'])
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : ''
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)

  try {
    // No LLM cost, but PDF parsing is CPU: cap per IP before reading the body.
    const limit = await checkRouteRateLimit({
      name: 'public-ats-fast-check',
      identifier: resolveRateLimitIdentity(req),
      limit: 20,
      windowSeconds: 60 * 60,
      failClosed: true,
    })
    if (!limit.ok) {
      return new Response(JSON.stringify({ error: clientErrorMessage('rate_limit') }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(limit.retryAfter),
          'x-request-id': requestId,
        },
      })
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const file = formData.get('file')
    if (!(file instanceof File)) {
      return jsonWithRequestId(
        { error: clientErrorMessage('invalid_input', 'Un fișier PDF sau DOCX este obligatoriu.') },
        400,
        requestId
      )
    }

    if (file.size === 0) {
      return jsonWithRequestId(
        { error: clientErrorMessage('invalid_input', 'Fișierul încărcat este gol.') },
        400,
        requestId
      )
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonWithRequestId(
        { error: clientErrorMessage('invalid_input', 'Fișierul depășește limita de 5 MB.') },
        413,
        requestId
      )
    }

    const extension = getFileExtension(file.name || '')
    if (!ALLOWED_EXTENSIONS.has(extension) || (file.type && !ALLOWED_MIME_TYPES.has(file.type))) {
      return jsonWithRequestId(
        { error: clientErrorMessage('invalid_input', 'Doar fișierele .pdf și .docx sunt suportate.') },
        415,
        requestId
      )
    }

    let fileBytes: Uint8Array | null = new Uint8Array(await file.arrayBuffer())
    if (!hasExpectedSignature(fileBytes, extension)) {
      return jsonWithRequestId(
        { error: clientErrorMessage('invalid_input', 'Formatul fișierului nu corespunde extensiei sale.') },
        415,
        requestId
      )
    }

    let rawText = ''
    try {
      rawText = extension === '.docx'
        ? await extractTextFromDocx(fileBytes)
        : await extractTextFromPdf(fileBytes)
    } catch (error) {
      const message = error instanceof PdfTextExtractError || error instanceof DocxTextExtractError
        ? error.message
        : 'Unknown error'
      logger.warn('Fast ATS check text extraction failed', {
        requestId,
        route: '/api/public/ats-fast-check',
        extension,
        error: message,
      })
      return jsonWithRequestId(
        {
          error: clientErrorMessage(
            'invalid_input',
            extension === '.docx'
              ? 'Nu s-a putut citi textul din fișierul DOCX.'
              : 'Nu s-a putut citi textul din PDF. Asigură-te că nu este o imagine scanată.'
          ),
        },
        422,
        requestId
      )
    } finally {
      fileBytes = null
    }

    if (rawText.trim().length < 50) {
      return jsonWithRequestId(
        {
          error: clientErrorMessage(
            'invalid_input',
            'Nu s-a putut extrage suficient text din document. Asigură-te că textul nu este o imagine.'
          ),
        },
        422,
        requestId
      )
    }

    // Run instant lightweight ATS analysis
    const analysis = analyzeResumeTextLightweight(rawText)

    const browserDistinctId = toBrowserDistinctId(formData.get('distinctId'))
    await capturePostHogEvent(
      browserDistinctId
        ? {
            distinctId: browserDistinctId,
            event: 'fast_ats_check_completed',
            properties: {
              score: analysis.overallScore,
              grade: analysis.grade,
              wordCount: analysis.wordCount,
              missingSectionsCount: analysis.missingSections.length,
            },
          }
        : {
            distinctId: 'anon:fast_scan',
            event: 'fast_ats_check_completed',
            properties: {
              score: analysis.overallScore,
              grade: analysis.grade,
            },
          }
    )

    return jsonWithRequestId({ success: true, result: analysis }, 200, requestId)
  } catch (error) {
    logger.error('Fast ATS check top-level failure', {
      requestId,
      route: '/api/public/ats-fast-check',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
