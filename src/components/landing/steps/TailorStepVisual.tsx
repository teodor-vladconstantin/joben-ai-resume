import { Card } from '@/components/ui/Card'

export function TailorStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm space-y-5">
      <div>
        <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-2">Job description · Stripe</p>
        <p className="text-sm text-(--foreground) leading-relaxed">
          You will own <span className="rounded bg-(--accent-muted) px-1 text-(--accent)">payment-rail integrations</span> for a high-volume,{' '}
          <span className="rounded bg-(--accent-muted) px-1 text-(--accent)">distributed systems</span> platform.
        </p>
      </div>
      <div className="border-t border-(--border) pt-4">
        <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-2">Bullet rewritten for this role</p>
        <p className="text-sm text-(--muted) line-through decoration-(--muted) mb-1">Built a payments service with retries and a queue.</p>
        <p className="text-sm text-(--foreground)">
          Designed a <span className="text-(--accent) font-medium">payment-rail</span> service with retry semantics across a{' '}
          <span className="text-(--accent) font-medium">distributed</span> queue.
        </p>
      </div>
    </Card>
  )
}
