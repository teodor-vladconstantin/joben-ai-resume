import { auth } from '@clerk/nextjs/server'
import { getRateLimitStatus } from '@/lib/ratelimit'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'

export async function GET(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()

    if (!userId) {
      return apiError(clientErrorMessage('auth'), 401, requestId)
    }

    const status = await getRateLimitStatus(userId)
    return apiSuccess(status, 200, requestId)
  } catch (error) {
    logger.error('rate-limit-status GET failed', {
      requestId,
      route: '/api/rate-limit-status',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500, requestId)
  }
}
