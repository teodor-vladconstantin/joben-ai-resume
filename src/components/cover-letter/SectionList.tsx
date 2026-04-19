"use client"

type SectionItem = {
  id: string
  label: string
  completed: boolean
}

type SectionListProps = {
  sections: SectionItem[]
  onSelect: (id: string) => void
}

export function SectionList({ sections, onSelect }: SectionListProps) {
  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSelect(section.id)}
          className="w-full rounded-xl border border-white/10 bg-[#0A0F0D] px-3 py-2 text-left hover:border-[#16DB65]/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{section.label}</span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${section.completed ? 'bg-[#0A9548]' : 'bg-[#374151]'}`}
              aria-hidden
            />
          </div>
        </button>
      ))}
    </div>
  )
}


