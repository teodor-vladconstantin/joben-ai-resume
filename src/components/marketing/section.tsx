import { Plus } from 'lucide-react'

import { cn } from '@/lib/cn'

// Marketing layout primitives, ported from nyra (components/marketing/section.tsx, cta.tsx, faq-list.tsx).
export const wrap = 'mx-auto w-full max-w-6xl px-4 sm:px-6'

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand', className)}>{children}</p>
}

export function Section({ id, eyebrow, title, intro, className, children }: {
  id?: string
  eyebrow?: string
  title: React.ReactNode
  intro?: React.ReactNode
  className?: string
  children?: React.ReactNode
}) {
  return (
    <section id={id} className={cn('scroll-mt-20 py-16 sm:py-24', className)}>
      <div className={wrap}>
        <div className="max-w-2xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 className="text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl">{title}</h2>
          {intro && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p>}
        </div>
        {children && <div className="mt-10 sm:mt-12">{children}</div>}
      </div>
    </section>
  )
}

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: React.ReactNode; intro?: React.ReactNode }) {
  return (
    <div className="border-b border-border">
      <div className={cn(wrap, 'py-16 sm:py-20')}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-[-0.035em] sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}
      </div>
    </div>
  )
}

export function CtaCard({ title, text, children }: { title: React.ReactNode; text?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="py-16 sm:py-24">
      <div className={wrap}>
        <div className="rounded-xl border border-border bg-card p-8 shadow-card sm:p-12">
          <div className="mb-6 h-1 w-12 rounded-full bg-primary" aria-hidden />
          <h2 className="max-w-xl text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl">{title}</h2>
          {text && <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{text}</p>}
          <div className="mt-8 flex flex-wrap gap-3">{children}</div>
        </div>
      </div>
    </section>
  )
}

export interface Faq { q: string; a: string }

// Native <details>: keyboard accessible, no JS.
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-medium">
            {f.q}
            <Plus className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" aria-hidden />
          </summary>
          <p className="px-5 pb-5 leading-relaxed text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  )
}
