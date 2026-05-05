"use client"

import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'

type SectionPanelProps = {
  title: string
  content: string
  sectionType?: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onDelete: () => void
}

function splitEducationContent(content: string): { mainContent: string; graduationDate: string } {
  const lines = content.split('\n')
  const lastLine = (lines[lines.length - 1] ?? '').trim()
  const isDateLike = /\d{4}/.test(lastLine) && lastLine.length < 40
  if (isDateLike && lines.length > 1) {
    return { mainContent: lines.slice(0, -1).join('\n'), graduationDate: lastLine }
  }
  return { mainContent: content, graduationDate: '' }
}

export function SectionPanel({
  title,
  content,
  sectionType,
  onTitleChange,
  onContentChange,
  onDelete,
}: SectionPanelProps) {
  const isEducation = sectionType === 'education'

  const { mainContent, graduationDate } = useMemo(
    () => (isEducation ? splitEducationContent(content) : { mainContent: content, graduationDate: '' }),
    [content, isEducation]
  )

  const handleMainContentChange = (val: string) => {
    if (isEducation && graduationDate) {
      onContentChange(val + '\n' + graduationDate)
    } else {
      onContentChange(val)
    }
  }

  const handleGraduationDateChange = (val: string) => {
    const trimmed = val.trim()
    if (trimmed) {
      onContentChange(mainContent + '\n' + trimmed)
    } else {
      onContentChange(mainContent)
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0A0F0D] p-4">
      <div className="mb-3 flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
        />
        <button
          onClick={onDelete}
          className="rounded-md border border-[#16DB65]/30 bg-[#0A9548]/12 p-2 text-[#16DB65] hover:bg-[#0A9548]/18"
          aria-label="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <textarea
        value={isEducation ? mainContent : content}
        onChange={(e) => isEducation ? handleMainContentChange(e.target.value) : onContentChange(e.target.value)}
        className="h-28 w-full resize-none rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
        placeholder={isEducation ? 'Institution name\nDegree, Field of Study' : 'Write section content...'}
      />
      {isEducation && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wide">Graduation Date / Period</p>
          <input
            value={graduationDate}
            onChange={(e) => handleGraduationDateChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
            placeholder="e.g. 2024 or Jun 2020 - May 2024"
          />
        </div>
      )}
    </div>
  )
}
