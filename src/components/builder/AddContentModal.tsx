'use client'

export type AddableSection = {
  type: string
  title: string
}

const defaultSections: AddableSection[] = [
  { type: 'summary', title: 'Summary' },
  { type: 'experience', title: 'Work Experience' },
  { type: 'education', title: 'Education' },
  { type: 'skills', title: 'Skills' },
  { type: 'projects', title: 'Projects' },
  { type: 'certifications', title: 'Certifications' },
  { type: 'languages', title: 'Languages' },
  { type: 'volunteer', title: 'Volunteer' },
  { type: 'awards', title: 'Awards' },
  { type: 'publications', title: 'Publications' },
  { type: 'references', title: 'References' },
  { type: 'custom', title: 'Custom Section' },
]

interface AddContentModalProps {
  open: boolean
  onClose: () => void
  onAdd: (section: AddableSection) => void
}

export function AddContentModal({ open, onClose, onAdd }: AddContentModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 bg-bg-elevated border border-border-medium rounded-xl p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-title text-text-primary font-semibold mb-4">Add Section</h2>
        <div className="grid grid-cols-2 gap-2">
          {defaultSections.map(s => (
            <button
              key={s.type}
              onClick={() => { onAdd(s); onClose() }}
              className="px-3 py-2 bg-bg-surface border border-border-soft rounded-md text-body text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export type { AddContentModalProps }
