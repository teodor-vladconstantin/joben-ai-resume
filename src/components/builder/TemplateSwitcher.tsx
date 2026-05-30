'use client'

type ResumeTemplate = 'harvard'

interface TemplateSwitcherProps {
  value: ResumeTemplate
  onChange: (value: ResumeTemplate) => void
}

export function TemplateSwitcher({ value, onChange }: TemplateSwitcherProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ResumeTemplate)}
        className="w-full px-3 py-1.5 bg-bg-subtle border border-border-soft text-text-primary text-body rounded-md focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors"
      >
        <option value="harvard">Harvard</option>
      </select>
    </div>
  )
}
