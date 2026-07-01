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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={ref} className="bg-[#111] border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="text-lg font-medium text-white mt-4">Important Notice</h3>
          <p className="text-white/80 mt-2 mb-4 text-sm">
            {title || "Please note that only PDF and DOCX files are supported for import. Scanned documents or images in PDF format will not be imported correctly."}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onConfirm}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}