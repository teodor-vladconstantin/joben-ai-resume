"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

// Refresh delays after mount; the Clerk webhook usually claims the scan within
// a second or two of sign-up. router.refresh() re-renders the dashboard on the
// server, which swaps this placeholder for the real AtsScanCard once claimed.
const REFRESH_AFTER_MS = [2000, 5000]
const GIVE_UP_AFTER_MS = 8000

// Shown right after sign-up from the free ATS checker, while the webhook has
// not linked the scan yet. Two refreshes, then it hides itself: no polling.
export function AtsScanCardPending() {
  const t = useTranslations('Dashboard.atsScanCard')
  const router = useRouter()
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    const timers = REFRESH_AFTER_MS.map((ms) => setTimeout(() => router.refresh(), ms))
    timers.push(setTimeout(() => setGaveUp(true), GIVE_UP_AFTER_MS))
    return () => timers.forEach(clearTimeout)
  }, [router])

  if (gaveUp) return null

  return (
    <section aria-busy="true" className="bg-(--surface-elevated) p-6 border border-(--border) mb-8">
      <p className="flex items-center gap-2 text-sm text-(--muted)">
        <Loader2 className="h-4 w-4 animate-spin" /> {t('loading')}
      </p>
    </section>
  )
}
