import { Card } from '@/components/ui/Card'

export function RewriteStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm">
      <p className="text-(length:--text-label) text-muted-foreground mb-4">Bullet rewrite</p>
      <div className="mb-4">
        <p className="text-[10px] text-muted-foreground mb-1">Before</p>
        <p className="text-sm text-muted-foreground line-through decoration-muted-foreground">Helped team increase sales.</p>
      </div>
      <div>
        <p className="text-[10px] text-foreground mb-1">After</p>
        <p className="text-sm text-foreground bg-primary/10 px-1 py-0.5">
          Spearheaded initiative driving a <span className="font-medium">23% sales increase</span> in Q3.
        </p>
      </div>
    </Card>
  )
}
