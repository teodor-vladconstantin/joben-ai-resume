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
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0A0F0D] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Body Paragraphs</h3>
          <button onClick={onClose} className="rounded-md p-1 text-[#FFFFFF]/82 hover:bg-[#0A0F0D] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {paragraphs.map((paragraph, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-[#0A0F0D] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-white">Paragraph {index + 1}</p>
                <button
                  onClick={() => removeParagraph(index)}
                  className="rounded-md border border-[#16DB65]/30 bg-[#0A9548]/12 p-1 text-[#16DB65] hover:bg-[#0A9548]/18"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={paragraph}
                onChange={(e) => updateParagraph(index, e.target.value)}
                className="h-24 w-full resize-none rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={addParagraph}
            className="rounded-lg border border-[#0A9548]/30 bg-[#0A9548]/10 px-3 py-2 text-sm font-semibold text-[#0A9548] hover:bg-[#0A9548]/20"
          >
            + Add Paragraph
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}



