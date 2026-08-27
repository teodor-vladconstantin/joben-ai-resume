"use client"

import { Lock } from 'lucide-react'
import { useRateLimitStatus } from '@/hooks/useRateLimitStatus'
import { hasFullTemplateLibraryAccess } from '@/lib/plan-definitions'

export type TemplateValue = 'harvard' | 'modern'

type TemplateSwitcherProps = {
  value: TemplateValue
  onChange: (value: TemplateValue) => void
  // Called instead of onChange when the user clicks a template their plan
  // doesn't unlock — ResumeBuilder wires this to the existing UpgradeBanner
  // (same pattern as tailor/analyze), no new upgrade UI here.
  onLockedTemplateSelect?: (templateId: TemplateValue) => void
}

const templates: Array<{ id: TemplateValue; name: string; description: string; requiresFullLibrary: boolean }> = [
  { id: 'harvard', name: 'Harvard', description: 'Classic academic layout', requiresFullLibrary: false },
  { id: 'modern', name: 'Modern', description: 'Accent-colored headers, sans-serif', requiresFullLibrary: true },
]

export function TemplateSwitcher({ value, onChange, onLockedTemplateSelect }: TemplateSwitcherProps) {
  const { status } = useRateLimitStatus()
  const unlocked = status ? hasFullTemplateLibraryAccess(status.plan) : false

  return (
    <div className="bg-(--surface) border border-(--border) rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-(--muted) mb-3">Template</p>
      <div className="grid grid-cols-1 gap-2.5">
        {templates.map((template) => {
          const isLocked = template.requiresFullLibrary && !unlocked
          return (
            <button
              key={template.id}
              onClick={() => (isLocked ? onLockedTemplateSelect?.(template.id) : onChange(template.id))}
              className={`text-left rounded-lg border px-3.5 py-2.5 transition-colors ${
                value === template.id
                  ? 'bg-(--accent-muted) border-(--border) text-(--foreground)'
                  : 'bg-(--surface) border-(--border) text-(--foreground)/72 hover:border-(--accent-strong)/60'
              } ${isLocked ? 'opacity-80' : ''}`}
            >
              <p className="text-sm font-semibold flex items-center gap-1.5">
                {template.name}
                {isLocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-(--accent-muted) px-1.5 py-0.5 text-[10px] font-semibold text-(--accent-strong)">
                    <Lock className="w-2.5 h-2.5" /> Recruiting
                  </span>
                ) : null}
              </p>
              <p className="text-[11px] text-(--muted) mt-0.5">{template.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
