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
      <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 mb-10">
        <div
          className="relative shrink-0 grid place-items-center rounded-full h-40 w-40 sm:h-48 sm:w-48"
          style={{
            background: `conic-gradient(var(--accent) ${score}%, color-mix(in srgb, var(--foreground) 10%, transparent) ${score}% 100%)`,
          }}
        >
          <div className="absolute inset-3 rounded-full bg-(--surface-elevated)" />
          <div className="relative text-center">
            <p className="text-6xl sm:text-7xl leading-none font-black text-(--foreground)">{score}</p>
            <p className="mt-1.5 text-xs uppercase tracking-wider text-(--accent)">/ 100</p>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <p className="text-2xl sm:text-3xl font-bold text-(--accent)">{gradeLabel}</p>
          <p className="mt-2 text-(--muted) max-w-md">{gradeDescription}</p>
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {categories.map((category) => (
          <div key={category.label}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-(--foreground) font-medium">{category.label}</span>
              <span className="text-(--muted) font-mono text-xs">{category.value}/{category.max}</span>
            </div>
            <div className="h-2 rounded-full bg-(--border) overflow-hidden">
              <div
                className="h-full rounded-full bg-(--accent)"
                style={{ width: `${(category.value / category.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
