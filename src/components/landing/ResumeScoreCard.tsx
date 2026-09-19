import { Card } from '@/components/ui/Card'

export interface ResumeScoreCardProps {
  score: number
  scoreLabel: string
  categoryBreakdownLabel: string
  categories: { label: string; value: number; max: number }[]
}

export function ResumeScoreCard({ score, scoreLabel, categoryBreakdownLabel, categories }: ResumeScoreCardProps) {
  return (
    <Card elevated className="p-6 w-full max-w-xs">
      <p className="font-mono text-(length:--text-label) text-(--muted)">{scoreLabel}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-5xl font-bold tabular-nums leading-none text-(--foreground)">{score}</span>
        <span className="font-mono text-sm text-(--muted)">/100</span>
      </div>
      <div className="mt-3 h-1 w-full bg-(--border)">
        <div className="h-full bg-(--accent)" style={{ width: `${score}%` }} />
      </div>

      <div className="mt-6 space-y-4">
        <p className="font-mono text-(length:--text-label) text-(--muted)">{categoryBreakdownLabel}</p>
        {categories.map((category) => (
          <div key={category.label}>
            <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
              <span className="text-(--foreground)">{category.label}</span>
              <span className="text-(--muted) font-mono text-xs tabular-nums">{category.value}/{category.max}</span>
            </div>
            <div className="h-1 bg-(--border) overflow-hidden">
              <div
                className="h-full bg-(--accent)"
                style={{ width: `${(category.value / category.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
