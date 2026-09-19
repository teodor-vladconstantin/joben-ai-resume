import { Card } from '@/components/ui/Card'

export function TailorStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm space-y-5">
      <div>
        <p className="font-mono text-(length:--text-label) text-(--muted) mb-2">Job description · Stripe</p>
        <p className="text-sm text-(--foreground) leading-relaxed">
          You will own <span className="bg-(--accent-muted) px-1">payment-rail integrations</span> for a high-volume,{' '}
          <span className="bg-(--accent-muted) px-1">distributed systems</span> platform.
        </p>
      </div>
      <div className="border-t border-(--border) pt-4">
        <p className="font-mono text-(length:--text-label) text-(--muted) mb-2">Bullet rewritten for this role</p>
        <p className="text-sm text-(--muted) line-through decoration-(--muted) mb-1">Built a payments service with retries and a queue.</p>
        <p className="text-sm text-(--foreground)">
          Designed a <span className="font-medium underline decoration-(--accent) decoration-2 underline-offset-2">payment-rail</span> service with retry semantics across a{' '}
          <span className="font-medium underline decoration-(--accent) decoration-2 underline-offset-2">distributed</span> queue.
        </p>
      </div>
    </Card>
  )
}
