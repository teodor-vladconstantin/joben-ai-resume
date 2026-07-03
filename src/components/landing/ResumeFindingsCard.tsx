import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Badge'

export interface ResumeFindingsCardProps {
  strengths: { title: string; description: string }
  improvements: { title: string; description: string }
}

export function ResumeFindingsCard({ strengths, improvements }: ResumeFindingsCardProps) {
  return (
    <Card elevated radius="lg" className="p-6 w-full max-w-xs space-y-6">
      <Eyebrow>What we found</Eyebrow>

      <div>
        <h3 className="text-(--foreground) font-bold mb-1.5">{strengths.title}</h3>
        <p className="text-sm text-(--muted)">{strengths.description}</p>
      </div>

      <div>
        <h3 className="text-(--foreground) font-bold mb-1.5">{improvements.title}</h3>
        <p className="text-sm text-(--muted)">{improvements.description}</p>
      </div>
    </Card>
  )
}
