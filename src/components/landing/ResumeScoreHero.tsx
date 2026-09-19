export interface ResumeScoreHeroProps {
  score: number
  gradeLabel: string
  gradeDescription: string
  categories: { label: string; value: number; max: number }[]
}

// Full-width, high-emphasis presentation of an ATS score for a result page
// (as opposed to ResumeScoreCard, a small max-w-xs card built for the
// homepage preview, kept separate and untouched, see the report on this
// change). gradeLabel/gradeDescription are pre-translated by the caller —
// the raw grade key from the API ('Poor'/'Fair'/'Good'/'Excellent') never
// reaches this component, so there's no locale-dependent lookup here.
export function ResumeScoreHero({ score, gradeLabel, gradeDescription, categories }: ResumeScoreHeroProps) {
  return (
    <div className="w-full">
      <div className="mb-10">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-(length:--text-score) font-bold leading-none tabular-nums text-(--foreground)">{score}</span>
          <span className="font-mono text-xl text-(--muted)">/100</span>
        </div>
        <div className="mt-3 h-1 w-full max-w-sm bg-(--border)">
          <div className="h-full bg-(--accent)" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
        </div>

        <p className="mt-6 text-2xl sm:text-3xl font-bold text-(--foreground)">{gradeLabel}</p>
        <p className="mt-2 text-(--muted) max-w-md">{gradeDescription}</p>
      </div>

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {categories.map((category) => (
          <div key={category.label}>
            <div className="flex items-center justify-between gap-3 text-sm mb-2">
              <span className="text-(--foreground) font-medium">{category.label}</span>
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
    </div>
  )
}
