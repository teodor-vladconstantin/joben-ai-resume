import { Card } from '@/components/ui/Card'

export function RewriteStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm">
      <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-4">Bullet rewrite</p>
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-wide text-(--muted) mb-1">Before</p>
        <p className="text-sm text-(--muted) line-through decoration-(--muted)">Helped team increase sales.</p>
      </div>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wide text-(--accent) mb-1">After</p>
        <p className="text-sm text-(--foreground)">
          Spearheaded initiative driving a <span className="text-(--accent) font-medium">23% sales increase</span> in Q3.
        </p>
      </div>
    </Card>
  )
}
