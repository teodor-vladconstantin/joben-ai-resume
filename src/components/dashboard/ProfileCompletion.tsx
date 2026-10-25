"use client"
import { X, CheckCircle2, Circle } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { dismissChecklist } from '@/lib/onboarding/actions'

type ChecklistStats = { resumes: number; coverLetters: number; aiReviews: number; pdfExports: number }

// Activation checklist: four steps up to the first exported PDF. Completion
// comes from existing stats; only "dismissed" is stored (users.onboarding).
export function ProfileCompletion({ stats, dismissed }: { stats: ChecklistStats; dismissed: boolean }) {
  const t = useTranslations('Dashboard.profileCompletion')
  const [isVisible, setIsVisible] = useState(!dismissed)
  const [, startTransition] = useTransition()

  const items = [
    { done: stats.resumes > 0, label: t('item1'), href: '/resumes/new' },
    { done: stats.aiReviews > 0, label: t('item3'), href: '/ai-review' },
    { done: stats.coverLetters > 0, label: t('item2'), href: '/cover-letters/new' },
    { done: stats.pdfExports > 0, label: t('item4'), href: '/resumes' },
  ]
  const completed = items.filter((item) => item.done).length
  if (!isVisible || completed === items.length) return null
  const percent = (completed / items.length) * 100

  const handleDismiss = () => {
    setIsVisible(false)
    startTransition(() => {
      void dismissChecklist().catch(() => undefined)
    })
  }

  return (
    <div data-tour="dashboard-checklist" className="bg-(--surface) p-6 border border-(--border) relative mb-8" suppressHydrationWarning>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('close')}
        className="absolute top-4 right-4 text-(--muted) hover:text-(--foreground) transition-colors duration-150 ease-out"
      >
        <X className="w-5 h-5" />
      </button>
      <h3 className="text-xl font-bold text-(--foreground) mb-4">{t('titlePrefix')}{Math.round(percent)}%</h3>
      <div className="w-full bg-(--border) h-1 mb-6">
        <div className="bg-(--accent) h-1" style={{ width: `${percent}%` }}></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 hover:text-(--foreground) transition-colors duration-150 ease-out">
            {item.done ? <CheckCircle2 className="w-5 h-5 text-(--foreground)" /> : <Circle className="w-5 h-5 text-(--muted)" />}
            <span className={item.done ? 'text-(--foreground)' : 'text-(--muted)'}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
