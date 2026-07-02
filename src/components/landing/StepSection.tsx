import * as React from 'react'

export interface StepSectionProps {
  number: string
  totalSteps: number
  category: string
  heading: string
  description: string
  bullets: string[]
  visual: React.ReactNode
}

export function StepSection({ number, totalSteps, category, heading, description, bullets, visual }: StepSectionProps) {
  return (
    <div className="grid gap-8 py-16 border-t border-(--border) first:border-t-0 lg:grid-cols-2 lg:items-start lg:gap-16">
      <div>
        <div className="flex items-center gap-4 mb-6">
          <span className="font-mono text-xs text-(--muted)">{number} / {String(totalSteps).padStart(2, '0')}</span>
          <span className="h-px flex-1 bg-(--border)" />
          <span className="font-mono text-xs uppercase tracking-wide text-(--accent)">{category}</span>
        </div>
        <h3 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">{heading}</h3>
        <p className="text-(--muted) mb-6">{description}</p>
        <ul className="space-y-2">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm text-(--muted)">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-(--accent) shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:sticky lg:top-32">{visual}</div>
    </div>
  )
}
