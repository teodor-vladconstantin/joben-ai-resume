'use client'

export interface FixPatchWithContext {
  experienceId: string
  bulletIndex: number
  originalBullet?: string
  updatedBullet?: string
  experienceTitle?: string
  company?: string
  original?: string
  fixed?: string
  context?: string
}

interface BeforeAfterModalProps {
  patches: FixPatchWithContext[]
  onClose: () => void
}

export function BeforeAfterModal({ patches, onClose }: BeforeAfterModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-2xl mx-4 bg-bg-elevated border border-border-medium rounded-xl p-6 max-h-[80vh] overflow-y-auto animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-title text-text-primary font-semibold mb-4">Changes Applied</h2>
        <div className="space-y-4">
          {patches.map((patch, i) => (
            <div key={i} className="space-y-2">
              <div className="text-xs text-text-muted uppercase tracking-wide">Original</div>
              <pre className="text-small text-text-secondary bg-bg-subtle border border-border-soft rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                {patch.originalBullet || patch.original || ''}
              </pre>
              <div className="text-xs text-text-muted uppercase tracking-wide">Updated</div>
              <pre className="text-small text-accent bg-bg-subtle border border-border-soft rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                {patch.updatedBullet || patch.fixed || ''}
              </pre>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-md border border-accent-border transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
