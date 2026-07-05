"use client"

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'

// Internal feedback route. Payments are not live during the beta, so every
// upgrade/checkout entry point opens this notice instead of a Stripe session.
const FEEDBACK_URL = '/feedback'

type UpgradeModalProps = {
  open: boolean
  onClose: () => void
  // Kept optional + unused so the existing call sites (ResumeBuilder,
  // CoverLetterBuilder, ai-review pages, pricing button) can keep passing
  // these props without changes while checkout stays disabled.
  title?: string
  description?: string
  onUpgrade?: () => Promise<void>
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Payments not active yet"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
          >
            Close
          </button>
          <Link href={FEEDBACK_URL} onClick={onClose} className={buttonVariants('primary', 'md')}>
            Leave feedback
          </Link>
        </div>
      }
    >
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--accent-strong)/35 bg-(--accent-muted) text-(--accent-strong)">
        <MessageCircle className="h-5 w-5" />
      </div>

      <p className="text-sm text-(--foreground)/72">
        Joben is in beta. We&apos;re not collecting payments yet — we&apos;re looking for feedback from early
        users to improve the product.
      </p>
    </Modal>
  )
}
