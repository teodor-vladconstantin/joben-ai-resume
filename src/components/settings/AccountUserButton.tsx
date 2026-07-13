'use client'

import { UserButton, useAuth } from '@clerk/nextjs'

export function AccountUserButton() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded || !isSignedIn) {
    return <div className="h-8 w-8 rounded-full bg-(--surface-elevated)" />
  }

  return <UserButton />
}
