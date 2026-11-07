"use client"
import { Lightbulb, RefreshCw, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function QuickTip({ isNewUser = false }: { isNewUser?: boolean }) {
  const t = useTranslations('Dashboard.quickTip')
  const tips = t.raw('tips') as string[]
  const [idx, setIdx] = useState(0)

  return (
    <div className="bg-card p-6 rounded-lg border border-border flex flex-col justify-between" suppressHydrationWarning>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="text-muted-foreground w-5 h-5" /> {t('title')}
          </h3>
          <button onClick={() => setIdx((idx + 1) % tips.length)} className="text-muted-foreground hover:text-foreground p-1 transition-colors duration-150 ease-out">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">{tips[idx]}</p>
      </div>
      <Link href="/resumes" className="inline-flex self-start items-center gap-1 text-foreground text-sm font-medium border-b border-transparent hover:border-primary transition-colors duration-150 ease-out">
        {isNewUser ? t('createFirstResume') : t('editResume')} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
