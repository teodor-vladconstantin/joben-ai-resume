import { auth } from '@clerk/nextjs/server'
import { getRateLimitStatus } from '@/lib/ratelimit'
import { apiError, apiSuccess, getErrorMessage } from '@/lib/api-response'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return apiError('Unauthorized', 401)
    }

    const status = await getRateLimitStatus(userId)
    return apiSuccess(status, 200)
  } catch (error) {
    return apiError(getErrorMessage(error), 500)
  }
}
