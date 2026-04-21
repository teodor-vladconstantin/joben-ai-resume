"use client"

import { useEffect, useState } from 'react'

type AILoadingStage = 'analyzing' | 'generating' | 'saving'

const STAGE_MESSAGES: Record<AILoadingStage, string> = {
  analyzing: 'Analizăm CV-ul tău...',
  generating: 'Generăm sugestii...',
  saving: 'Salvăm analiza...',
}

interface AILoadingStateProps {
  stage: AILoadingStage
  done?: boolean
}

export function AILoadingState({ stage, done = false }: AILoadingStateProps) {
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
      <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[#0A9548] animate-spin" />
      <p className="text-white font-semibold">{STAGE_MESSAGES[stage]}</p>
      <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-[#0A9548] to-[#16DB65] rounded-full transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
