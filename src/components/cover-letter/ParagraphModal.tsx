"use client"

import { Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'

type ParagraphModalProps = {
  open: boolean
  paragraphs: string[]
  onClose: () => void
  onChange: (next: string[]) => void
}

export function ParagraphModal({ open, paragraphs, onClose, onChange }: ParagraphModalProps) {
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
      title="Body Paragraphs"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={addParagraph}
            className="rounded-lg border border-(--accent)/30 bg-(--accent-muted) px-3 py-2 text-sm font-semibold text-(--accent) hover:bg-(--accent)/20"
          >
            + Add Paragraph
          </button>
          <button onClick={onClose} className={buttonVariants('primary', 'md')}>
            Save Changes
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {paragraphs.map((paragraph, index) => (
          <div key={index} className="rounded-xl border border-(--border) bg-(--surface) p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-(--foreground)">Paragraph {index + 1}</p>
              <button
                onClick={() => removeParagraph(index)}
                className="rounded-md border border-(--accent-strong)/30 bg-(--accent-muted) p-1 text-(--accent-strong) hover:bg-(--accent)/18"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={paragraph}
              onChange={(e) => updateParagraph(index, e.target.value)}
              className="h-24 w-full resize-none rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
            />
          </div>
        ))}
      </div>
    </Modal>
  )
}
