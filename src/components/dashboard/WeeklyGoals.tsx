"use client"
import { useEffect, useState } from 'react'
import { Flame, Target, CheckCircle2 } from 'lucide-react'

type Stats = { resumes: number; coverLetters: number; aiReviews: number }

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function computeStreak(isActiveToday: boolean): number {
  try {
    const raw = localStorage.getItem('joben_streak')
    const stored = raw ? (JSON.parse(raw) as { lastDay: string; count: number }) : null
    const today = todayKey()
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    if (!isActiveToday) return stored?.count ?? 0

    if (!stored) return 1
    if (stored.lastDay === today) return stored.count
    if (stored.lastDay === yesterday) return stored.count + 1
    return 1
  } catch {
    return isActiveToday ? 1 : 0
  }
}

function saveStreak(count: number) {
  try {
    localStorage.setItem('joben_streak', JSON.stringify({ lastDay: todayKey(), count }))
  } catch {}
}

export function WeeklyGoals({ stats }: { stats?: Stats }) {
  const rsCount = stats?.resumes ?? 0
  const clCount = stats?.coverLetters ?? 0
  const aiCount = stats?.aiReviews ?? 0

  const resumeGoalMet = rsCount >= 1
  const aiGoalMet = aiCount >= 1
  const clGoalMet = clCount >= 1
  const goalsCompleted = [resumeGoalMet, aiGoalMet, clGoalMet].filter(Boolean).length
  const isActiveToday = goalsCompleted > 0

  // `computeStreak` reads localStorage, which doesn't exist on the server —
  // computing it inline (e.g. via useMemo) would make the client's first
  // render disagree with the server-rendered markup. Start at a
  // server-safe default and only read the real value after mount.
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const computed = computeStreak(isActiveToday)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount read of localStorage, not a subscribable external store
    setStreak(computed)
    if (isActiveToday) saveStreak(computed)
  }, [isActiveToday])

  const goals = [
    { label: 'Build a resume', current: rsCount, target: 1, done: resumeGoalMet },
    { label: 'Run an AI review', current: aiCount, target: 1, done: aiGoalMet },
    { label: 'Create a cover letter', current: clCount, target: 1, done: clGoalMet },
  ]

  return (
    <div className="bg-(--surface) p-6 rounded-2xl border border-(--border) flex flex-col" suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-(--foreground) flex items-center gap-2">
          <Target className="text-(--accent) w-5 h-5" /> Weekly Goals
        </h3>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
          streak > 0 ? 'bg-(--accent-muted) text-(--accent)' : 'bg-(--surface-elevated) text-(--muted)'
        }`}>
          <Flame className="w-4 h-4" />
          {streak} {streak === 1 ? 'day' : 'days'}
        </div>
      </div>

      <div className="space-y-4 grow">
        {goals.map((goal, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-sm ${goal.done ? 'text-(--accent)' : 'text-(--muted)'}`}>
                {goal.done && <CheckCircle2 className="w-4 h-4 inline mr-1.5" />}{goal.label}
              </span>
              <span className="text-(--muted) text-xs">
                {Math.min(goal.current, goal.target)}/{goal.target}
              </span>
            </div>
            <div className="w-full bg-(--surface-elevated) rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${goal.done ? 'bg-(--accent)' : 'bg-(--border)'}`}
                style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-(--border) text-center">
        <p className="text-sm text-(--muted) mb-1">
          {goalsCompleted}/3 goals complete this week
        </p>
        <p className="text-sm font-medium text-(--accent)">
          {goalsCompleted === 3
            ? 'All goals done! Keep it up!'
            : goalsCompleted > 0
            ? 'Keep going — you\'re on track!'
            : 'Start your streak today!'}
        </p>
      </div>
    </div>
  )
}
