"use client"

import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'

type ParagraphModalProps = {
  open: boolean
  paragraphs: string[]
  onClose: () => void
  onChange: (next: string[]) => void
}

export function ParagraphModal({ open, paragraphs, onClose, onChange }: ParagraphModalProps) {
  const t = useTranslations('CoverLetterBuilder.paragraphModal')
  const updateParagraph = (index: number, value: string) => {
    const next = [...paragraphs]
    next[index] = value
    onChange(next)
  }

  const addParagraph = () => {
    onChange([...paragraphs, ''])
  }

  const removeParagraph = (index: number) => {
    const next = paragraphs.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [''])
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('title')}
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={addParagraph}
            className={buttonVariants('secondary', 'sm')}
          >
            {t('addParagraphButton')}
          </button>
          <button onClick={onClose} className={buttonVariants('primary', 'md')}>
            {t('saveChangesButton')}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {paragraphs.map((paragraph, index) => (
          <div key={index} className="border border-(--border) bg-(--surface) p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-(--foreground)">{t('paragraphLabel', { number: index + 1 })}</p>
              <button
                onClick={() => removeParagraph(index)}
                className="border border-(--border) p-1 text-(--muted) hover:border-(--accent) hover:text-(--foreground) transition-colors duration-150 ease-out"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={paragraph}
              onChange={(e) => updateParagraph(index, e.target.value)}
              className="h-24 w-full resize-none rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none"
            />
          </div>
        ))}
      </div>
    </Modal>
  )
}
