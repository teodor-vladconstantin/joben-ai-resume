"use client"

import { Trash2 } from 'lucide-react'

type SectionPanelProps = {
  title: string
  content: string
  showTitleField?: boolean
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onDelete: () => void
}

export function SectionPanel({
  title,
  content,
  showTitleField = true,
  onTitleChange,
  onContentChange,
  onDelete,
}: SectionPanelProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0A0F0D] p-4">
      <div className="mb-3 flex items-center gap-2">
        {showTitleField ? (
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
          />
        ) : (
          <div className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white/80">
            {title || 'Education'}
          </div>
        )}
        <button
          onClick={onDelete}
          className="rounded-md border border-[#16DB65]/30 bg-[#0A9548]/12 p-2 text-[#16DB65] hover:bg-[#0A9548]/18"
          aria-label="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className="h-28 w-full resize-none rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
        placeholder="Write section content..."
      />
    </div>
  )
}
