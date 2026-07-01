import * as React from 'react'
import { AlertTriangle } from 'lucide-react'

interface AlertModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
}

export function AlertModal({ isOpen, onConfirm, onCancel, title }: AlertModalProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && ref.current && !ref.current.contains(event.target as Node)) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div ref={ref} className="bg-bg-elevated border border-border-medium rounded-xl p-6 max-w-md w-full mx-4 animate-fade-in-up">
        <div className="text-center">
          <AlertTriangle size={28} className="mx-auto text-warning" />
          <h3 className="text-heading font-medium text-text-primary mt-4">Important Notice</h3>
          <p className="text-small text-text-secondary mt-2 mb-4">
            {title || "Please note that only PDF and DOCX files are supported for import. Scanned documents or images in PDF format will not be imported correctly."}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onConfirm}
              className="bg-accent hover:bg-accent-hover text-white text-body font-medium px-4 py-1.5 rounded-md border border-accent-border transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}