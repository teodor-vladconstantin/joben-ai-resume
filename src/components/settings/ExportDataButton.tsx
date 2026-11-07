import Link from 'next/link'
import { Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'

type ExportDataButtonProps = {
  label: string
  buttonLabel: string
  pdfButtonLabel?: string
}

export function ExportDataButton({ label, buttonLabel, pdfButtonLabel }: ExportDataButtonProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Download size={14} />
        {label}
      </div>
      <div className="flex items-center gap-2">
        <Link href="/api/account/export" prefetch={false} className={buttonVariants('secondary', 'sm')}>
          {buttonLabel}
        </Link>
        {pdfButtonLabel ? (
          <Link href="/api/account/export?format=pdf" prefetch={false} className={buttonVariants('secondary', 'sm')}>
            {pdfButtonLabel}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
