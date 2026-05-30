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
    <div className="space-y-1.5">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSelect(section.id)}
          className="w-full rounded-md border border-border-soft bg-bg-surface px-3 py-2 text-left hover:border-border-medium transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-body font-medium text-text-primary">{section.label}</span>
            <span
              className={`h-2 w-2 rounded-full ${section.completed ? 'bg-accent' : 'bg-border-medium'}`}
              aria-hidden
            />
          </div>
        </button>
      ))}
    </div>
  )
}
