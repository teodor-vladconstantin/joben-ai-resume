"use client"

type TemplateValue = 'harvard'

type TemplateSwitcherProps = {
  value: TemplateValue
  onChange: (value: TemplateValue) => void
}

const templates: Array<{ id: TemplateValue; name: string; description: string }> = [
  { id: 'harvard', name: 'Harvard', description: 'Classic academic layout' },
]

export function TemplateSwitcher({ value, onChange }: TemplateSwitcherProps) {
  return (
    <div className="bg-[#0A0F0D] border border-white/10 rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-[#FFFFFF]/82 mb-3">Template</p>
      <div className="grid grid-cols-1 gap-2.5">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onChange(template.id)}
            className={`text-left rounded-lg border px-3.5 py-2.5 transition-colors ${
              value === template.id
                ? 'bg-[#0A9548]/10 border-white/12 text-white'
                : 'bg-[#0A0F0D] border-white/10 text-[#FFFFFF]/72 hover:border-[#16DB65]/60'
            }`}
          >
            <p className="text-sm font-semibold">{template.name}</p>
            <p className="text-[11px] text-[#FFFFFF]/82 mt-0.5">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}


