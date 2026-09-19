"use client"
import { FileText, Mail, FileSearch, TrendingUp } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function StatCards({ stats }: { stats: { resumes: number, coverLetters: number, aiReviews: number, averageScore: number } }) {
  const t = useTranslations('Dashboard.statCards')

  return (
    <div className="grid grid-cols-1 border border-(--border) divide-y divide-(--border) mb-8 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4" suppressHydrationWarning>
      {[
        { label: t('resumes'), count: stats.resumes.toString(), icon: FileText, href: '/resumes' },
        { label: t('coverLetters'), count: stats.coverLetters.toString(), icon: Mail, href: '/cover-letters' },
        { label: t('reviews'), count: stats.aiReviews.toString(), icon: FileSearch, href: '/ai-review' },
        { label: t('avgScore'), count: `${stats.averageScore}/100`, icon: TrendingUp, href: '/ai-review' }
      ].map((stat, i) => (
        <Link
          key={i}
          href={stat.href}
          className="flex items-center justify-between gap-4 p-6 transition-colors duration-150 ease-out hover:bg-(--surface)"
        >
          <div>
            <p className="text-(--muted) text-sm font-medium mb-1">{stat.label}</p>
            <p className="font-mono text-2xl font-bold tabular-nums text-(--foreground)">{stat.count}</p>
          </div>
          <stat.icon className="w-5 h-5 text-(--muted) shrink-0" />
        </Link>
      ))}
    </div>
  )
}
