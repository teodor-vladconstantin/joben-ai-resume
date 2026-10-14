import { auth } from '@clerk/nextjs/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { getUserReferralInfo } from '@/lib/referral'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    const info = await getUserReferralInfo(userId)
    // Just signed up: the Clerk webhook has not created the users row yet.
    if (!info) return jsonWithRequestId({ pending: true }, 200, requestId)
    return jsonWithRequestId({ success: true, ...info }, 200, requestId)
  } catch (error) {
    logger.error('Failed to get referral info', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
