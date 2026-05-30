"use client"

import { Trash2 } from 'lucide-react'

type SectionPanelProps = {
  key?: string
  title: string
  content: string
  sectionType: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onDelete: () => void
}

export function SectionPanel({
  title,
  content,
  sectionType,
  onTitleChange,
  onContentChange,
  onDelete,
}: SectionPanelProps) {
  return (
    <div className="rounded-lg border border-border-soft bg-bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full rounded-md border border-border-soft bg-bg-subtle px-3 py-1.5 text-body text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
        />
        <button
          onClick={onDelete}
          className="rounded-md border border-accent-border bg-accent-muted p-1.5 text-accent hover:bg-accent/20 transition-colors"
          aria-label="Delete section"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className="h-28 w-full resize-none rounded-md border border-border-soft bg-bg-subtle px-3 py-1.5 text-body text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
        placeholder="Write section content..."
      />
    </div>
  )
}
