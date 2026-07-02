"use client"

import { ArrowDown } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'

export type FixPatchWithContext = {
  experienceId: string
  bulletIndex: number
  originalBullet: string
  updatedBullet: string
  experienceTitle?: string
  company?: string
}

type BeforeAfterModalProps = {
  patches: FixPatchWithContext[]
  onClose: () => void
}

export function BeforeAfterModal({ patches, onClose }: BeforeAfterModalProps) {
  const count = patches.length

  return (
    <Modal
      open
      onClose={onClose}
      title={`AI Applied ${count} ${count === 1 ? 'Improvement' : 'Improvements'}`}
      maxWidth="xl"
      footer={
        <button onClick={onClose} className={`w-full ${buttonVariants('primary', 'md')}`}>
          View in Editor
        </button>
      }
    >
      <div className="space-y-4">
        {patches.map((patch, idx) => (
          <div
            key={`${patch.experienceId}-${patch.bulletIndex}-${idx}`}
            className="rounded-xl border border-(--border) overflow-hidden"
          >
            {(patch.experienceTitle || patch.company) && (
              <div className="px-4 py-2 bg-(--surface-elevated) border-b border-(--border)">
                <p className="text-xs font-medium text-(--muted)">
                  {[patch.experienceTitle, patch.company].filter(Boolean).join(' · ')}
                </p>
              </div>
            )}

            <div className="p-4 space-y-2">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-(--accent-strong) font-semibold mb-1.5">Before</p>
                <p className="text-sm bg-(--accent-muted) text-(--foreground) border-l-2 border-(--accent-strong) px-3 py-2 rounded-r leading-relaxed">
                  {patch.originalBullet || <span className="italic opacity-60">(empty)</span>}
                </p>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-(--muted)" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-(--accent) font-semibold mb-1.5">After</p>
                <p className="text-sm bg-(--accent-muted) text-(--accent-strong) border-l-2 border-(--accent) px-3 py-2 rounded-r leading-relaxed">
                  {patch.updatedBullet}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
