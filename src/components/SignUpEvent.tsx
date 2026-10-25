'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { pushGtmEvent } from '@/lib/gtm-events'

const NEW_ACCOUNT_MS = 2 * 60 * 1000
const SENT_KEY = 'jb_sign_up_event_sent'

// GA4 `sign_up`: signup_completed fires on the server (Clerk webhook), which
// cannot reach the dataLayer, so the first page a brand-new account loads
// reports it. Clerk redirects to wherever sign-up started, so this runs on every page.
export function SignUpEvent() {
  const { isSignedIn, user } = useUser()

  useEffect(() => {
    if (!isSignedIn || !user?.createdAt) return
    if (Date.now() - user.createdAt.getTime() > NEW_ACCOUNT_MS) return
    try {
      if (sessionStorage.getItem(SENT_KEY) === user.id) return
      sessionStorage.setItem(SENT_KEY, user.id)
    } catch {
      // Storage blocked: report once per mount.
    }
    pushGtmEvent('sign_up', { method: 'clerk' })
  }, [isSignedIn, user])

  return null
}
