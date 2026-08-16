export interface ResumeScoreHeroProps {
  score: number
  scoreLabel: string
  categories: { label: string; value: number; max: number }[]
}

const GRADE_COPY: Record<string, string> = {
  Poor: 'Significant issues here are likely costing you interviews.',
  Fair: 'A few fixes below would meaningfully improve your chances.',
  Good: 'Solid resume — a couple of tweaks would make it stronger.',
  Excellent: 'Strong resume — ATS software and recruiters should have no trouble with it.',
}

// Full-width, high-emphasis presentation of an ATS score for a result page
// (as opposed to ResumeScoreCard, a small max-w-xs card built for the
// homepage preview — kept separate and untouched, see the report on this
// change).
export function ResumeScoreHero({ score, scoreLabel, categories }: ResumeScoreHeroProps) {
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
            <p className="mt-1.5 text-xs uppercase tracking-wider text-(--accent)">out of 100</p>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <p className="text-2xl sm:text-3xl font-bold text-(--accent)">{scoreLabel}</p>
          <p className="mt-2 text-(--muted) max-w-md">
            {GRADE_COPY[scoreLabel] || 'Here is how your resume breaks down across the categories that matter most.'}
          </p>
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
