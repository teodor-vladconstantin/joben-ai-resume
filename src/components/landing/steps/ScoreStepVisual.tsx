import { Card } from '@/components/ui/Card'

const MINI_CATEGORIES = [
  { label: 'ATS readability', value: 92 },
  { label: 'Content quality', value: 88 },
  { label: 'Writing quality', value: 95 },
]

export function ScoreStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm">
      <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-4">resume.pdf · scored</p>
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-5xl font-black text-(--foreground)">93</span>
        <span className="text-sm text-(--muted)">/ 100 · Excellent</span>
      </div>
      <div className="space-y-3">
        {MINI_CATEGORIES.map((category) => (
          <div key={category.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-(--foreground)">{category.label}</span>
              <span className="text-(--muted) font-mono">{category.value}%</span>
            </div>
            <div className="h-1 rounded-full bg-(--border) overflow-hidden">
              <div className="h-full rounded-full bg-(--accent)" style={{ width: `${category.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
