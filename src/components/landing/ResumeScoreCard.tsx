import { Card } from '@/components/ui/Card'

export interface ResumeScoreCardProps {
  score: number
  scoreLabel: string
  categories: { label: string; value: number; max: number }[]
}

export function ResumeScoreCard({ score, scoreLabel, categories }: ResumeScoreCardProps) {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-xs">
      <div className="flex flex-col items-center text-center mb-6">
        <div
          className="relative grid h-24 w-24 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--accent) ${score}%, color-mix(in srgb, var(--foreground) 10%, transparent) ${score}% 100%)`,
          }}
        >
          <div className="absolute inset-2 rounded-full bg-(--surface-elevated)" />
          <div className="relative text-center">
            <p className="text-2xl leading-none font-black text-(--foreground)">{score}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-(--accent)">/ 100</p>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-(--accent)">{scoreLabel}</p>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-mono uppercase tracking-wide text-(--muted)">Category breakdown</p>
        {categories.map((category) => (
          <div key={category.label}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-(--foreground)">{category.label}</span>
              <span className="text-(--muted) font-mono text-xs">{category.value}/{category.max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-(--border) overflow-hidden">
              <div
                className="h-full rounded-full bg-(--accent)"
                style={{ width: `${(category.value / category.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
