"use client"
import { FileText, Mail, FileSearch, TrendingUp } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function StatCards({ stats }: { stats: { resumes: number, coverLetters: number, aiReviews: number, averageScore: number } }) {
  const t = useTranslations('Dashboard.statCards')

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" suppressHydrationWarning>
      {[
        { label: t('resumes'), count: stats.resumes.toString(), icon: FileText, href: '/resumes' },
        { label: t('coverLetters'), count: stats.coverLetters.toString(), icon: Mail, href: '/cover-letters' },
        { label: t('reviews'), count: stats.aiReviews.toString(), icon: FileSearch, href: '/ai-review' },
        { label: t('avgScore'), count: `${stats.averageScore}/100`, icon: TrendingUp, href: '/ai-review' }
      ].map((stat, i) => (
        <Link
          key={i}
          href={stat.href}
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-card transition-colors hover:border-primary"
        >
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{stat.count}</p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <stat.icon className="size-5" />
          </span>
        </Link>
      ))}
    </div>
  )
}
