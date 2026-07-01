'use client'

import { X } from 'lucide-react'
import Link from 'next/link'

interface UpgradeModalProps {
  open: boolean
  title?: string
  description?: string
  children?: React.ReactNode
  onClose?: () => void
  onUpgrade?: () => void | Promise<void>
}

export function UpgradeModal({ open, title = 'Upgrade to Pro', description, children, onClose, onUpgrade }: UpgradeModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 bg-bg-elevated border border-border-medium rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-title text-text-primary font-semibold">{title}</h2>
          {onClose && (
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        {description && (
          <p className="mt-2 text-body text-text-secondary">{description}</p>
        )}
        {children}
        <button
          onClick={async () => {
            if (onUpgrade) await onUpgrade()
          }}
          className="mt-4 w-full text-center px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-md border border-accent-border transition-colors"
        >
          <Link href="/pricing" className="block">View Pricing</Link>
        </button>
      </div>
    </div>
  )
}
