import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Badge'

export interface ResumeFindingsCardProps {
  label: string
  strengths: { title: string; description: string }
  improvements: { title: string; description: string }
}

export function ResumeFindingsCard({ label, strengths, improvements }: ResumeFindingsCardProps) {
  return (
    <Card radius="lg" className="p-6 w-full max-w-none space-y-6">
      <Eyebrow>{label}</Eyebrow>

      <div>
        <h3 className="text-foreground font-bold mb-1.5">{strengths.title}</h3>
        <p className="text-sm text-muted-foreground">{strengths.description}</p>
      </div>

      <div>
        <h3 className="text-foreground font-bold mb-1.5">{improvements.title}</h3>
        <p className="text-sm text-muted-foreground">{improvements.description}</p>
      </div>
    </Card>
  )
}
