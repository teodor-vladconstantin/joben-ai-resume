'use client'

import { Link } from '@/i18n/navigation'
import { pushGtmEvent } from '@/lib/gtm-events'

type TrackedLinkProps = {
  href: string
  ctaId: string
  className?: string
  children: React.ReactNode
}

// Link that reports a `cta_click` GA4 event (cta_id + destination) through GTM.
export function TrackedLink({ href, ctaId, className, children }: TrackedLinkProps) {
  return (
    <Link href={href} className={className} onClick={() => pushGtmEvent('cta_click', { cta_id: ctaId, destination: href })}>
      {children}
    </Link>
  )
}
