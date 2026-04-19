"use client"

import { X } from 'lucide-react'

export type AddableSectionType =
  | 'professional_summary'
  | 'career_objective'
  | 'education'
  | 'leadership'
  | 'projects'
  | 'research'
  | 'certifications'
  | 'awards'
  | 'publications'
  | 'skills'

export type AddableSection = {
  type: AddableSectionType
  title: string
  description: string
}

const SECTION_OPTIONS: AddableSection[] = [
  { type: 'professional_summary', title: 'Professional Summary', description: 'Concise overview of your profile' },
  { type: 'career_objective', title: 'Career Objective', description: 'Role-focused positioning statement' },
  { type: 'education', title: 'Education', description: 'Degrees and academic background' },
  { type: 'leadership', title: 'Leadership', description: 'Leadership and ownership examples' },
  { type: 'projects', title: 'Projects', description: 'Notable projects and outcomes' },
  { type: 'research', title: 'Research', description: 'Research work and findings' },
  { type: 'certifications', title: 'Certifications', description: 'Professional certifications' },
  { type: 'awards', title: 'Awards & Honors', description: 'Awards, scholarships, distinctions' },
  { type: 'publications', title: 'Publications', description: 'Articles and publications' },
  { type: 'skills', title: 'Skills', description: 'Technical and professional skills' },
]

type AddContentModalProps = {
  open: boolean
  onClose: () => void
  onAdd: (section: AddableSection) => void
}

export function AddContentModal({ open, onClose, onAdd }: AddContentModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0A0F0D] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Add Content Section</h3>
          <button onClick={onClose} className="rounded-md p-1 text-[#FFFFFF]/82 hover:bg-[#0A0F0D] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_OPTIONS.map((item) => (
            <button
              key={item.type}
              onClick={() => onAdd(item)}
                   className="rounded-xl border border-white/10 bg-[#0A0F0D] p-4 text-left transition-colors hover:border-[#16DB65]/60 hover:bg-white/5"
            >
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-[#FFFFFF]/82">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


