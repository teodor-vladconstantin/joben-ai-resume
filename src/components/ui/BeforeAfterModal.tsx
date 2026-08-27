"use client"

import { useState, type ReactNode } from 'react'
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
  // New numbers/tools this rewrite introduced that weren't in the original
  // bullet or its sibling context. When present, the modal switches into
  // confirm mode for this patch (see BeforeAfterModalProps.onConfirm).
  newClaims?: string[]
}

type BeforeAfterModalProps = {
  patches: FixPatchWithContext[]
  onClose: () => void
  // Omit for the existing "already applied" summary view (auto-fix/apply-fix
  // — unchanged). Pass to switch into confirm-before-apply mode: patches
  // with newClaims require their checkbox checked before the footer button
  // (which calls onConfirm instead of just closing) is enabled.
  onConfirm?: (patches: FixPatchWithContext[]) => void
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderWithHighlights(text: string, claims: string[]): ReactNode {
  const unique = [...new Set(claims)].filter(Boolean).sort((a, b) => b.length - a.length)
  if (unique.length === 0) return text

  const pattern = new RegExp(`(${unique.map(escapeRegExp).join('|')})`, 'g')
  return text.split(pattern).map((part, index) =>
    unique.includes(part) ? (
      <mark key={index} className="rounded bg-amber-400/30 px-0.5 font-semibold text-amber-200">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  )
}

export function BeforeAfterModal({ patches, onClose, onConfirm }: BeforeAfterModalProps) {
  const [confirmedKeys, setConfirmedKeys] = useState<Set<string>>(new Set())
  const count = patches.length
  const isConfirmMode = Boolean(onConfirm)
  const patchesNeedingConfirmation = patches.filter((patch) => (patch.newClaims?.length ?? 0) > 0)
  const allConfirmed = patchesNeedingConfirmation.every((patch) =>
    confirmedKeys.has(`${patch.experienceId}-${patch.bulletIndex}`)
  )

  function toggleConfirmed(key: string) {
    setConfirmedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={
        isConfirmMode
          ? `Review ${count} ${count === 1 ? 'Change' : 'Changes'} Before Applying`
          : `AI Applied ${count} ${count === 1 ? 'Improvement' : 'Improvements'}`
      }
      maxWidth="xl"
      footer={
        isConfirmMode ? (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
            >
              Discard
            </button>
            <button
              onClick={() => onConfirm?.(patches)}
              disabled={!allConfirmed}
              className={`disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants('primary', 'md')}`}
            >
              Apply Changes
            </button>
          </div>
        ) : (
          <button onClick={onClose} className={`w-full ${buttonVariants('primary', 'md')}`}>
            View in Editor
          </button>
        )
      }
    >
      <div className="space-y-4">
        {patches.map((patch, idx) => {
          const key = `${patch.experienceId}-${patch.bulletIndex}`
          const claims = patch.newClaims || []

          return (
            <div
              key={`${key}-${idx}`}
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
                    {renderWithHighlights(patch.updatedBullet, claims)}
                  </p>
                </div>

                {claims.length > 0 ? (
                  <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={confirmedKeys.has(key)}
                      onChange={() => toggleConfirmed(key)}
                      className="mt-0.5"
                    />
                    <span className="text-xs text-amber-200">
                      This rewrite added details not in your original text ({claims.join(', ')}).
                      Confirm these are real before applying.
                    </span>
                  </label>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
