import { NextRequest } from 'next/server'
import { parsePdfBuffer } from '@/lib/parse-pdf-server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req)
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return jsonWithRequestId({ error: 'No PDF file provided.' }, 400, requestId)
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const data = await parsePdfBuffer(buffer)
    return jsonWithRequestId(data, 200, requestId)
  } catch (error) {
    logger.error('parse-resume failed', {
      requestId,
      route: '/api/parse-resume',
      error: getErrorMessage(error),
    })
    return jsonWithRequestId({ error: 'Failed to parse resume.' }, 500, requestId)
  }
}
