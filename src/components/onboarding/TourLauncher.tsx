"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { HelpCircle } from 'lucide-react'
import posthog from 'posthog-js'
import type { Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { getOnboardingState, markTourSeen } from '@/lib/onboarding/actions'
import { shouldAutoStart, type OnboardingState, type TourId } from '@/lib/onboarding/state'
import { resolveSteps, selectorFor } from '@/lib/onboarding/steps'
import { TOURS } from '@/lib/onboarding/tours'

const AUTO_START_DELAY_MS = 3000
const DESKTOP_QUERY = '(min-width: 1024px)'

// Spotlight tour for one section. Desktop only: below 1024 px it renders
// nothing (phones get the handoff card instead).
export function TourLauncher({ tourId }: { tourId: TourId }) {
  const t = useTranslations('Onboarding')
  const tRef = useRef(t)
  tRef.current = t
  const [isDesktop, setIsDesktop] = useState(false)
  const stateRef = useRef<OnboardingState | null>(null)
  const driverRef = useRef<Driver | null>(null)
  const runningRef = useRef(false)
  const mountedRef = useRef(false)

  const start = useCallback(
    async (trigger: 'auto' | 'manual') => {
      if (runningRef.current) return
      const steps = resolveSteps(TOURS[tourId], (anchor) => document.querySelector(selectorFor(anchor)) !== null)
      if (steps.length === 0) return
      runningRef.current = true

      let driver: typeof import('driver.js').driver
      try {
        ;({ driver } = await import('driver.js'))
      } catch {
        runningRef.current = false
        return
      }
      // Unmounted or shrunk below desktop while the chunk was loading.
      if (!mountedRef.current || !window.matchMedia(DESKTOP_QUERY).matches) {
        runningRef.current = false
        return
      }
      const label = tRef.current
      const alreadySeen = Boolean(stateRef.current?.tours[tourId])

      const instance = driver({
        showProgress: true,
        progressText: '{{current}} / {{total}}',
        nextBtnText: label('ui.next'),
        prevBtnText: label('ui.prev'),
        doneBtnText: label('ui.done'),
        popoverClass: 'joben-tour',
        stagePadding: 6,
        overlayOpacity: 0.6,
        smoothScroll: true,
        steps: steps.map((step) => ({
          element: selectorFor(step.anchor),
          popover: {
            title: label(`tours.${tourId}.${step.key}.title`),
            description: label(`tours.${tourId}.${step.key}.body`),
          },
        })),
        onHighlightStarted: (_element, _step, opts) => {
          posthog.capture('tour_step_viewed', { tourId, stepIndex: opts.index })
        },
        onDestroyed: (_element, _step, opts) => {
          runningRef.current = false
          const reason = opts.reason
          // 'api' and 'replaced' mean the page changed under the tour: neither a skip nor a finish.
          if (reason !== 'done' && reason !== 'close' && reason !== 'escape' && reason !== 'overlay') return
          if (reason === 'done') posthog.capture('tour_completed', { tourId })
          else posthog.capture('tour_skipped', { tourId, stepIndex: opts.index })
          if (!alreadySeen) {
            void markTourSeen(tourId).catch(() => undefined)
            if (stateRef.current) {
              stateRef.current = { ...stateRef.current, tours: { ...stateRef.current.tours, [tourId]: new Date().toISOString() } }
            }
          }
        },
      })
      driverRef.current = instance
      try {
        posthog.capture('tour_started', { tourId, trigger })
        instance.drive()
      } catch {
        runningRef.current = false
      }
    },
    [tourId]
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    setIsDesktop(query.matches)
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isDesktop) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    getOnboardingState()
      .then((state) => {
        if (cancelled) return
        stateRef.current = state
        if (shouldAutoStart({ state, tourId, isDesktop })) {
          timer = setTimeout(() => {
            if (!runningRef.current && !stateRef.current?.tours[tourId]) void start('auto')
          }, AUTO_START_DELAY_MS)
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      if (driverRef.current?.isActive()) driverRef.current.destroy()
    }
  }, [isDesktop, tourId, start])

  if (!isDesktop) return null

  return (
    <button
      type="button"
      onClick={() => void start('manual')}
      aria-label={t('ui.help')}
      title={t('ui.help')}
      className="fixed bottom-5 right-5 z-40 grid h-10 w-10 place-items-center border border-(--border) bg-(--surface) text-(--foreground) transition-colors duration-150 ease-out hover:border-(--accent)"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  )
}
