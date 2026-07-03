"use client"

import * as React from 'react'
import { X } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl'
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ModalProps['maxWidth']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, footer, maxWidth = 'lg' }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <Card
        elevated
        radius="lg"
        className={`relative flex w-full ${MAX_WIDTH_CLASSES[maxWidth]} max-h-[85vh] flex-col shadow-2xl`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-(--border) px-6 py-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-(--foreground)">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-(--muted) hover:bg-(--surface-elevated) hover:text-(--foreground)"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 grow overflow-y-auto px-6 py-5">{children}</div>

        {footer ? <div className="shrink-0 border-t border-(--border) px-6 py-4">{footer}</div> : null}
      </Card>
    </div>
  )
}
