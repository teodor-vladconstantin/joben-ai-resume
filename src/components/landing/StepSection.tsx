import * as React from 'react'
import { RevealRule } from '@/components/motion/RevealRule'
import { RevealWords } from '@/components/motion/RevealWords'
import { Reveal } from '@/components/motion/Reveal'

export interface StepSectionProps {
  number: string
  totalSteps: number
  category: string
  heading: string
  description: string
  bullets: string[]
  visual: React.ReactNode
  isFirst?: boolean
}

export function StepSection({ number, totalSteps, category, heading, description, bullets, visual, isFirst = false }: StepSectionProps) {
  return (
    <div data-section={category} className="py-16 first:pt-0">
      {isFirst ? null : <RevealRule className="mb-16" />}
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-xs text-(--muted)">{number} / {String(totalSteps).padStart(2, '0')}</span>
            <span className="h-px flex-1 bg-(--border)" />
            <span className="font-mono text-xs text-(--foreground)">{category}</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">
            <RevealWords text={heading} />
          </h3>
          <p className="text-(--muted) mb-6">{description}</p>
          <ul className="space-y-2">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-sm text-(--muted)">
                <span className="mt-2 h-1 w-1 bg-(--accent) shrink-0" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
        <Reveal className="lg:sticky lg:top-32" threshold={0.3}>{visual}</Reveal>
      </div>
    </div>
  )
}
