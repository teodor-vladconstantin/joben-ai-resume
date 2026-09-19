"use client"

import { useTranslations } from 'next-intl'

export type TemplateValue = 'harvard'

type TemplateSwitcherProps = {
  value: TemplateValue
  onChange: (value: TemplateValue) => void
}

export function TemplateSwitcher({ value, onChange }: TemplateSwitcherProps) {
  const t = useTranslations('Builder.templateSwitcher')
  const templates: Array<{ id: TemplateValue; name: string; description: string }> = [
    { id: 'harvard', name: t('harvardName'), description: t('harvardDescription') },
  ]

  return (
    <div className="bg-(--surface) border border-(--border) p-4">
      <p className="font-mono text-(length:--text-label) text-(--muted) mb-3">{t('heading')}</p>
      <div className="grid grid-cols-1 gap-2.5">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onChange(template.id)}
            className={`text-left border px-3.5 py-2.5 transition-colors duration-150 ease-out ${
              value === template.id
                ? 'bg-(--accent-muted) border-(--border) text-(--foreground)'
                : 'bg-(--surface) border-(--border) text-(--foreground)/72 hover:border-(--accent)'
            }`}
          >
            <p className="text-sm font-semibold">{template.name}</p>
            <p className="text-[11px] text-(--muted) mt-0.5">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
