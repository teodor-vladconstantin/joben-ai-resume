'use client'

import { useEffect } from 'react'
import { pushGtmEvent } from '@/lib/gtm-events'

// Fires one GTM event when the page mounts (e.g. `pricing_viewed`).
export function TrackOnView({ event }: { event: 'pricing_viewed' }) {
  useEffect(() => {
    pushGtmEvent(event)
  }, [event])
  return null
}
