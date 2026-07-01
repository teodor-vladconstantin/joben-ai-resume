import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card ref={ref} elevated radius="lg" className="p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="text-lg font-medium text-(--foreground) mt-4">Important Notice</h3>
          <p className="text-(--muted) mt-2 mb-4 text-sm">
            {title || "Please note that only PDF and DOCX files are supported for import. Scanned documents or images in PDF format will not be imported correctly."}
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={onConfirm}>I Understand</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}