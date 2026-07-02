"use client"
import { X, CheckCircle2, Circle } from 'lucide-react'
import { useState } from 'react'

export function ProfileCompletion({ stats }: { stats?: { resumes: number, coverLetters: number, aiReviews: number } }) {
  const [isVisible, setIsVisible] = useState(true)
  if (!isVisible) return null

  const hasResume = (stats?.resumes ?? 0) > 0
  const hasCoverLetter = (stats?.coverLetters ?? 0) > 0
  const hasAiReview = (stats?.aiReviews ?? 0) > 0

  const completionCount = [hasResume, hasCoverLetter, hasAiReview].filter(Boolean).length
  const percent = (completionCount / 3) * 100

  return (
    <div className="bg-(--surface) p-6 rounded-2xl border border-(--border) relative mb-8" suppressHydrationWarning>
      <button onClick={() => setIsVisible(false)} className="absolute top-4 right-4 text-(--muted) hover:text-(--foreground)">
        <X className="w-5 h-5" />
      </button>
      <h3 className="text-xl font-bold text-(--foreground) mb-4">Profile Completion - {Math.round(percent)}%</h3>
      <div className="w-full bg-(--background) rounded-full h-2.5 mb-6 border border-(--border)">
        <div className="bg-(--accent) h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">{hasResume ? <CheckCircle2 className="w-5 h-5 text-(--accent)" /> : <Circle className="w-5 h-5 text-(--muted)" />}<span className="text-(--muted)">Create first resume</span></div>
        <div className="flex items-center gap-3">{hasCoverLetter ? <CheckCircle2 className="w-5 h-5 text-(--accent)" /> : <Circle className="w-5 h-5 text-(--muted)" />}<span className="text-(--muted)">Create cover letter</span></div>
        <div className="flex items-center gap-3">{hasAiReview ? <CheckCircle2 className="w-5 h-5 text-(--accent)" /> : <Circle className="w-5 h-5 text-(--muted)" />}<span className="text-(--muted)">Get AI review</span></div>
      </div>
    </div>
  )
}
