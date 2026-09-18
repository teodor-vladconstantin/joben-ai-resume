"use client"

import { Link } from '@/i18n/navigation'
import { useAuth } from '@clerk/nextjs'

type AuthAwareSignupLinkProps = {
  className?: string
  children: React.ReactNode
  signedInHref?: string
  signedOutHref?: string
}

export function AuthAwareSignupLink({
  className,
  children,
  signedInHref = '/dashboard',
  signedOutHref = '/sign-up',
}: AuthAwareSignupLinkProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const href = isLoaded && isSignedIn ? signedInHref : signedOutHref

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
