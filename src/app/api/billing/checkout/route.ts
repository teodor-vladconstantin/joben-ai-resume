import { getRequestId, jsonWithRequestId } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  return jsonWithRequestId(
    { error: 'Payments are disabled while Joben is in testing. No charge will be made.' },
    403,
    requestId
  )
}
