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
      <p className="text-(length:--text-label) text-muted-foreground">{scoreLabel}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-5xl font-bold tabular-nums leading-none text-foreground">{score}</span>
        <span className="text-sm text-muted-foreground">/100</span>
      </div>
      <div className="mt-3 h-1 w-full bg-border">
        <div className="h-full bg-primary" style={{ width: `${score}%` }} />
      </div>

      <div className="mt-6 space-y-4">
        <p className="text-(length:--text-label) text-muted-foreground">{categoryBreakdownLabel}</p>
        {categories.map((category) => (
          <div key={category.label}>
            <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
              <span className="text-foreground">{category.label}</span>
              <span className="text-muted-foreground text-xs tabular-nums">{category.value}/{category.max}</span>
            </div>
            <div className="h-1 bg-border overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${(category.value / category.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
