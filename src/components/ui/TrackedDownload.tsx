'use client'

import posthog from 'posthog-js'
import { pushGtmEvent } from '@/lib/gtm-events'

type TrackedDownloadProps = {
  href: string
  ctaId: string
  className?: string
  children: React.ReactNode
}

// Plain file link (no locale prefix) that reports a `cta_click` GA4 event and a
// `template_downloaded` PostHog event (PostHog drops it without analytics consent).
export function TrackedDownload({ href, ctaId, className, children }: TrackedDownloadProps) {
  return (
    <a
      href={href}
      download
      className={className}
      onClick={() => {
        pushGtmEvent('cta_click', { cta_id: ctaId, destination: href })
        posthog.capture('template_downloaded', { cta_id: ctaId, destination: href })
      }}
    >
      {children}
    </a>
  )
}
