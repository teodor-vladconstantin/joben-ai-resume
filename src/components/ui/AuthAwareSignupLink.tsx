"use client"

import { Link } from '@/i18n/navigation'
import { useAuth } from '@clerk/nextjs'
import { pushGtmEvent } from '@/lib/gtm-events'

type AuthAwareSignupLinkProps = {
  className?: string
  children: React.ReactNode
  signedInHref?: string
  signedOutHref?: string
  /** When set, a click reports a `cta_click` GA4 event with this id. */
  ctaId?: string
}

export function AuthAwareSignupLink({
  className,
  children,
  signedInHref = '/dashboard',
  signedOutHref = '/sign-up',
  ctaId,
}: AuthAwareSignupLinkProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const href = isLoaded && isSignedIn ? signedInHref : signedOutHref

  return (
    <Link
      href={href}
      className={className}
      onClick={ctaId ? () => pushGtmEvent('cta_click', { cta_id: ctaId, destination: href }) : undefined}
    >
      {children}
    </Link>
  )
}
