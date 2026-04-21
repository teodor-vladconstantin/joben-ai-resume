"use client"

import { useState } from 'react'
import { Crown, X } from 'lucide-react'

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

  if (!open) return null

  async function handleUpgrade() {
    setIsUpgrading(true)
    try {
      await onUpgrade()
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0F0D] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-[#FFFFFF]/82 hover:bg-[#0A0F0D] hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#16DB65]/35 bg-[#0A9548]/12 text-[#16DB65]">
          <Crown className="h-5 w-5" />
        </div>

        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm text-[#FFFFFF]/72">{description}</p>

        <div className="mt-5 rounded-xl border border-white/10 bg-[#0A0F0D] p-4 text-sm text-[#FFFFFF]/72">
          <p>Pro includes:</p>
          <p className="mt-2">Unlimited AI analysis and tailoring</p>
          <p>Advanced rewrite and bullet optimization</p>
          <p>Priority generation and premium templates</p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-[#0A0F0D] px-4 py-2 text-sm text-[#FFFFFF]/72"
          >
            Maybe Later
          </button>
          <button
            onClick={() => void handleUpgrade()}
            disabled={isUpgrading}
            className="rounded-lg bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUpgrading ? 'Redirecting...' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>
    </div>
  )
}



