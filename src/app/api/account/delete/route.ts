import { auth, reverificationErrorResponse } from '@clerk/nextjs/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getRequestId } from '@/lib/logger'
import { deleteAccount } from '@/lib/account-deletion'

export { OWNED_TABLES, OTHER_OWNED_TABLES } from '@/lib/account-deletion'

function isConfirmed(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as { confirm?: unknown }).confirm === true
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const { userId, has } = await auth()
  if (!userId) {
    return apiError('You must be signed in.', 401, requestId)
  }

  // SECURITY: irreversible, so a hijacked or idle session is not enough:
  // Clerk asks the user to re-verify (first factor within the last 10 min).
  if (!has({ reverification: 'strict' })) {
    return reverificationErrorResponse('strict')
  }

  // SECURITY: irreversible action. Requiring an explicit JSON confirmation
  // means a cross-site form post or a stray request cannot trigger it.
  const body = await req.json().catch(() => null)
  if (!isConfirmed(body)) {
    return apiError('Confirmation required.', 400, requestId)
  }

  const result = await deleteAccount(userId, { requestId })
  if (!result.ok) {
    if (result.reason === 'stripe') {
      return apiError('Could not cancel your subscription. Your account was not deleted, please try again.', 502, requestId)
    }
    return apiError('Could not process account deletion.', 500, requestId)
  }

  return apiSuccess({ deleted: true }, 200, requestId)
}
