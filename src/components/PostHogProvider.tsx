'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

function PostHogIdentify() {
  const { isSignedIn, user } = useUser()

  useEffect(() => {
    if (isSignedIn && user) {
      posthog.identify(user.id)
    } else if (isSignedIn === false) {
      // Clears the distinct_id so the next anonymous visitor on this device
      // isn't attributed to the user who just signed out.
      posthog.reset()
    }
  }, [isSignedIn, user])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogIdentify />
      {children}
    </PHProvider>
  )
}
