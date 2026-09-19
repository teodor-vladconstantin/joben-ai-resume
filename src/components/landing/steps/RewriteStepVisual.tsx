import { Card } from '@/components/ui/Card'

export function RewriteStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm">
      <p className="font-mono text-(length:--text-label) text-(--muted) mb-4">Bullet rewrite</p>
      <div className="mb-4">
        <p className="font-mono text-[10px] text-(--muted) mb-1">Before</p>
        <p className="text-sm text-(--muted) line-through decoration-(--muted)">Helped team increase sales.</p>
      </div>
      <div>
        <p className="font-mono text-[10px] text-(--foreground) mb-1">After</p>
        <p className="text-sm text-(--foreground) bg-(--accent-muted) px-1 py-0.5">
          Spearheaded initiative driving a <span className="font-medium">23% sales increase</span> in Q3.
        </p>
      </div>
    </Card>
  )
}
