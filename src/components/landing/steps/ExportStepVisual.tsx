import { Card } from '@/components/ui/Card'
import { Download } from 'lucide-react'

const DOCUMENTS = [
  { name: 'Resume — Stripe (v3)', format: 'PDF ready' },
  { name: 'Resume — Vercel (v2)', format: 'PDF ready' },
  { name: 'Cover Letter — Stripe', format: 'PDF ready' },
]

export function ExportStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm">
      <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-4">Your documents</p>
      <div className="space-y-3">
        {DOCUMENTS.map((doc) => (
          <div key={doc.name} className="flex items-center justify-between gap-3 rounded-lg border border-(--border) px-3 py-2.5">
            <div>
              <p className="text-sm text-(--foreground)">{doc.name}</p>
              <p className="text-xs text-(--muted)">{doc.format}</p>
            </div>
            <Download className="w-4 h-4 text-(--accent) shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  )
}
