import Link from 'next/link'
import { Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'

type ExportDataButtonProps = {
  label: string
  buttonLabel: string
}

export function ExportDataButton({ label, buttonLabel }: ExportDataButtonProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-(--muted)">
        <Download size={14} />
        {label}
      </div>
      <Link href="/api/account/export" prefetch={false} className={buttonVariants('secondary', 'sm')}>
        {buttonLabel}
      </Link>
    </div>
  )
}
