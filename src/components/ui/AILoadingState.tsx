"use client"

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type AILoadingStage = 'analyzing' | 'generating' | 'saving'

interface AILoadingStateProps {
  stage: AILoadingStage
  done?: boolean
}

export function AILoadingState({ stage, done = false }: AILoadingStateProps) {
  const t = useTranslations('Builder.aiLoadingState')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let rafId: number

    if (done) {
      rafId = requestAnimationFrame(() => setProgress(100))
      return () => cancelAnimationFrame(rafId)
    }

    const startTime = Date.now()
    const duration = 3000

    const frame = () => {
      const elapsed = Date.now() - startTime
      const raw = (elapsed / duration) * 90
      const capped = Math.min(raw, 90)
      setProgress(capped)
      if (capped < 90) {
        rafId = requestAnimationFrame(frame)
      }
    }

    rafId = requestAnimationFrame(() => {
      setProgress(0)
      rafId = requestAnimationFrame(frame)
    })

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [done, stage])

  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="w-12 h-12 rounded-full border-4 border-(--border) border-t-(--accent) animate-spin" />
      <p className="text-(--foreground) font-semibold">{t(stage)}</p>
      <div className="w-64 h-1 bg-(--border) overflow-hidden">
        <div
          className="h-full bg-(--accent) transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
