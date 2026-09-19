"use client"

import { useTranslations } from 'next-intl'
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

type AddContentModalProps = {
  open: boolean
  onClose: () => void
  onAdd: (section: AddableSection) => void
}

export function AddContentModal({ open, onClose, onAdd }: AddContentModalProps) {
  const t = useTranslations('Builder.addContentModal')

  const SECTION_OPTIONS: AddableSection[] = [
    { type: 'professional_summary', title: t('options.professionalSummary.title'), description: t('options.professionalSummary.description') },
    { type: 'career_objective', title: t('options.careerObjective.title'), description: t('options.careerObjective.description') },
    { type: 'education', title: t('options.education.title'), description: t('options.education.description') },
    { type: 'leadership', title: t('options.leadership.title'), description: t('options.leadership.description') },
    { type: 'projects', title: t('options.projects.title'), description: t('options.projects.description') },
    { type: 'research', title: t('options.research.title'), description: t('options.research.description') },
    { type: 'certifications', title: t('options.certifications.title'), description: t('options.certifications.description') },
    { type: 'awards', title: t('options.awards.title'), description: t('options.awards.description') },
    { type: 'publications', title: t('options.publications.title'), description: t('options.publications.description') },
    { type: 'skills', title: t('options.skills.title'), description: t('options.skills.description') },
  ]

  return (
    <Modal open={open} onClose={onClose} title={t('title')} maxWidth="2xl">
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
