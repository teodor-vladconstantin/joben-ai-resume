'use client'

import { pushGtmEvent } from '@/lib/gtm-events'

type TrackedDownloadProps = {
  href: string
  ctaId: string
  className?: string
  children: React.ReactNode
}

// Plain file link (no locale prefix) that reports a `cta_click` GA4 event.
export function TrackedDownload({ href, ctaId, className, children }: TrackedDownloadProps) {
  return (
    <a href={href} download className={className} onClick={() => pushGtmEvent('cta_click', { cta_id: ctaId, destination: href })}>
      {children}
    </a>
  )
}
