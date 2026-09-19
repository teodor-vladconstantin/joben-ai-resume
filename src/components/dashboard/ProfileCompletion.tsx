"use client"
import { X, CheckCircle2, Circle } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function ProfileCompletion({ stats }: { stats?: { resumes: number, coverLetters: number, aiReviews: number } }) {
  const t = useTranslations('Dashboard.profileCompletion')
  const [isVisible, setIsVisible] = useState(true)
  if (!isVisible) return null

  const hasResume = (stats?.resumes ?? 0) > 0
  const hasCoverLetter = (stats?.coverLetters ?? 0) > 0
  const hasAiReview = (stats?.aiReviews ?? 0) > 0

  const completionCount = [hasResume, hasCoverLetter, hasAiReview].filter(Boolean).length
  const percent = (completionCount / 3) * 100

  return (
    <div className="bg-(--surface) p-6 border border-(--border) relative mb-8" suppressHydrationWarning>
      <button onClick={() => setIsVisible(false)} className="absolute top-4 right-4 text-(--muted) hover:text-(--foreground) transition-colors duration-150 ease-out">
        <X className="w-5 h-5" />
      </button>
      <h3 className="text-xl font-bold text-(--foreground) mb-4">{t('titlePrefix')}{Math.round(percent)}%</h3>
      <div className="w-full bg-(--border) h-1 mb-6">
        <div className="bg-(--accent) h-1" style={{ width: `${percent}%` }}></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">{hasResume ? <CheckCircle2 className="w-5 h-5 text-(--foreground)" /> : <Circle className="w-5 h-5 text-(--muted)" />}<span className="text-(--muted)">{t('item1')}</span></div>
        <div className="flex items-center gap-3">{hasCoverLetter ? <CheckCircle2 className="w-5 h-5 text-(--foreground)" /> : <Circle className="w-5 h-5 text-(--muted)" />}<span className="text-(--muted)">{t('item2')}</span></div>
        <div className="flex items-center gap-3">{hasAiReview ? <CheckCircle2 className="w-5 h-5 text-(--foreground)" /> : <Circle className="w-5 h-5 text-(--muted)" />}<span className="text-(--muted)">{t('item3')}</span></div>
      </div>
    </div>
  )
}
