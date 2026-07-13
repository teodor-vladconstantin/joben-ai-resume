import { Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'

export function ExportDataButton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-body text-text-secondary">
        <Download size={14} className="text-text-muted" />
        Export my data
      </div>
      <a href="/api/account/export" className={buttonVariants('secondary', 'sm')}>
        Export My Data
      </a>
    </div>
  )
}
