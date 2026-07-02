"use client"

import { Modal } from '@/components/ui/Modal'

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
  return (
    <Modal open={open} onClose={onClose} title="Add Content Section" maxWidth="2xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTION_OPTIONS.map((item) => (
          <button
            key={item.type}
            onClick={() => onAdd(item)}
            className="rounded-xl border border-(--border) bg-(--surface) p-4 text-left transition-colors hover:border-(--accent-strong)/60 hover:bg-(--surface-elevated)"
          >
            <p className="text-sm font-semibold text-(--foreground)">{item.title}</p>
            <p className="mt-1 text-xs text-(--muted)">{item.description}</p>
          </button>
        ))}
      </div>
    </Modal>
  )
}
