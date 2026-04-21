"use client"

import { X, ArrowDown } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[82vh] flex flex-col rounded-2xl border border-white/10 bg-[#0A0F0D] shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              AI Applied {count} {count === 1 ? 'Improvement' : 'Improvements'}
            </h2>
            <p className="text-xs text-[#FFFFFF]/60 mt-0.5">Review each change before editing further</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#FFFFFF]/60 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patches */}
        <div className="min-h-0 overflow-y-auto p-6 space-y-4">
          {patches.map((patch, idx) => (
            <div
              key={`${patch.experienceId}-${patch.bulletIndex}-${idx}`}
              className="rounded-xl border border-white/10 overflow-hidden"
            >
              {(patch.experienceTitle || patch.company) && (
                <div className="px-4 py-2 bg-white/5 border-b border-white/10">
                  <p className="text-xs font-medium text-[#FFFFFF]/60">
                    {[patch.experienceTitle, patch.company].filter(Boolean).join(' · ')}
                  </p>
                </div>
              )}

              <div className="p-4 space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-red-400 font-semibold mb-1.5">Before</p>
                  <p className="text-sm bg-red-500/10 text-red-200 border-l-2 border-red-500 px-3 py-2 rounded-r leading-relaxed">
                    {patch.originalBullet || <span className="italic opacity-60">(empty)</span>}
                  </p>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="w-4 h-4 text-[#FFFFFF]/30" />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#0A9548] font-semibold mb-1.5">After</p>
                  <p className="text-sm bg-[#0A9548]/10 text-[#16DB65] border-l-2 border-[#0A9548] px-3 py-2 rounded-r leading-relaxed">
                    {patch.updatedBullet}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-linear-to-r from-[#0A9548] to-[#04471C] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            View in Editor
          </button>
        </div>
      </div>
    </div>
  )
}
