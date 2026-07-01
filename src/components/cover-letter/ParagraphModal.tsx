"use client"

import { X, Trash2 } from 'lucide-react'

type ParagraphModalProps = {
  open: boolean
  paragraphs: string[]
  onClose: () => void
  onChange: (next: string[]) => void
}

export function ParagraphModal({ open, paragraphs, onClose, onChange }: ParagraphModalProps) {
  if (!open) return null

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-xl border border-border-medium bg-bg-elevated p-6 animate-fade-in-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-heading font-medium text-text-primary">Body Paragraphs</h3>
          <button onClick={onClose} className="rounded-md p-1 text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {paragraphs.map((paragraph, index) => (
            <div key={index} className="rounded-md border border-border-soft bg-bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-body font-medium text-text-primary">Paragraph {index + 1}</p>
                <button
                  onClick={() => removeParagraph(index)}
                  className="rounded-sm border border-accent-border bg-accent-muted p-1 text-accent hover:bg-accent/20 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                value={paragraph}
                onChange={(e) => updateParagraph(index, e.target.value)}
                className="h-24 w-full resize-none rounded-md border border-border-soft bg-bg-subtle px-3 py-1.5 text-body text-text-primary focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={addParagraph}
            className="rounded-md border border-accent-border bg-accent-muted px-3 py-1.5 text-body font-medium text-accent hover:bg-accent/20 transition-colors"
          >
            + Add Paragraph
          </button>
          <button
            onClick={onClose}
            className="rounded-md bg-accent hover:bg-accent-hover px-4 py-1.5 text-body font-medium text-white transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
