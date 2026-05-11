import { auth } from '@clerk/nextjs/server'
import { getRateLimitStatus } from '@/lib/ratelimit'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return apiError(clientErrorMessage('auth'), 401)
    }

    const status = await getRateLimitStatus(userId)
    return apiSuccess(status, 200)
  } catch (error) {
    logger.error('rate-limit-status GET failed', {
      route: '/api/rate-limit-status',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}
