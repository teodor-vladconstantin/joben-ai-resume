import { Card } from '@/components/ui/Card'

export function CoverLetterStepVisual() {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-sm">
      <p className="text-xs font-mono uppercase tracking-wide text-(--muted) mb-4">Cover letter · Stripe</p>
      <div className="rounded-lg bg-white p-4 text-[#1F2937] text-xs leading-relaxed space-y-2">
        <p>Dear Hiring Manager,</p>
        <p>
          Having <span className="rounded bg-(--accent-muted) px-1 text-(--accent)">reduced checkout failures by 40%</span> in my
          current role, I&apos;m excited about the Senior Software Engineer position on your payments team.
        </p>
        <p>Sincerely, John Doe</p>
      </div>
    </Card>
  )
}
