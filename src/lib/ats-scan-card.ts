import type { ClaimedAtsScan } from '@/lib/actions/db'

// How long after account creation the dashboard waits for the Clerk webhook
// to claim the scan the user signed up from. Older accounts never show the
// pending state (their scan was claimed long ago, or never will be).
export const ATS_SCAN_PENDING_WINDOW_MS = 10 * 60 * 1000

export type AtsScanCardState =
  | { kind: 'card'; scan: ClaimedAtsScan }
  | { kind: 'pending' }
  | { kind: 'none' }

// What the dashboard shows for the free-ATS-checker scan:
//   card    - the webhook already linked a scan to this account
//   pending - the user signed up with a scan id (Clerk unsafeMetadata) a few
//             minutes ago, but the webhook has not claimed it yet
//   none    - no scan; the card does not render
export function selectAtsScanCardState(input: {
  claimed: ClaimedAtsScan | null
  pendingScanId: string | null
  userCreatedAt: number | null
  now?: number
}): AtsScanCardState {
  const now = input.now ?? Date.now()
  if (input.claimed) return { kind: 'card', scan: input.claimed }
  if (
    input.pendingScanId &&
    input.userCreatedAt !== null &&
    now - input.userCreatedAt < ATS_SCAN_PENDING_WINDOW_MS
  ) {
    return { kind: 'pending' }
  }
  return { kind: 'none' }
}
