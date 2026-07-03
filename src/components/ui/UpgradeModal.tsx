"use client"

import { MessageCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'

const FEEDBACK_FORM_URL = 'https://app.youform.com/forms/vorotlgc'

type UpgradeModalProps = {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
  onUpgrade?: () => Promise<void>
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Suntem încă în testare"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
          >
            Am înțeles
          </button>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants('primary', 'md')}
          >
            Lasă-mi feedback
          </a>
        </div>
      }
    >
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--accent-strong)/35 bg-(--accent-muted) text-(--accent-strong)">
        <MessageCircle className="h-5 w-5" />
      </div>

      <p className="text-sm text-(--foreground)/72">
        Salut! Joben e încă în perioada de testare, așa că nu încasăm plăți acum — poți continua să folosești
        aplicația liber.
      </p>
      <p className="mt-3 text-sm text-(--foreground)/72">
        Mi-ar fi de mare ajutor să aflu ce părere ai: ce funcționează bine, ce lipsește, ce ai schimba.
      </p>
    </Modal>
  )
}
