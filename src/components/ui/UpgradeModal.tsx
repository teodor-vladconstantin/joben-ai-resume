"use client"

import { useState } from 'react'
import { Crown } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'

type UpgradeModalProps = {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
  onUpgrade: () => Promise<void>
}

export function UpgradeModal({
  open,
  title = 'Upgrade to Pro',
  description = 'Unlock unlimited AI actions and premium optimization tools.',
  onClose,
  onUpgrade,
}: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false)

  async function handleUpgrade() {
    setIsUpgrading(true)
    try {
      await onUpgrade()
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
          >
            Maybe Later
          </button>
          <button
            onClick={() => void handleUpgrade()}
            disabled={isUpgrading}
            className={`disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
          >
            {isUpgrading ? 'Redirecting...' : 'Upgrade to Pro'}
          </button>
        </div>
      }
    >
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--accent-strong)/35 bg-(--accent-muted) text-(--accent-strong)">
        <Crown className="h-5 w-5" />
      </div>

      <p className="text-sm text-(--foreground)/72">{description}</p>

      <div className="mt-5 rounded-xl border border-(--border) bg-(--surface) p-4 text-sm text-(--foreground)/72">
        <p>Pro includes:</p>
        <p className="mt-2">Unlimited AI analysis and tailoring</p>
        <p>Advanced rewrite and bullet optimization</p>
        <p>Priority generation and premium templates</p>
      </div>
    </Modal>
  )
}
