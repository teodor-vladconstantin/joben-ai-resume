import { Loader2 } from 'lucide-react'

interface AILoadingStateProps {
  stage?: string
}

export function AILoadingState({ stage }: AILoadingStateProps) {
  const messages: Record<string, string> = {
    generating: 'Generating content...',
    saving: 'Saving changes...',
    analyzing: 'Analyzing resume...',
    improving: 'Improving content...',
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Loader2 size={24} className="text-accent animate-spin" />
      <p className="text-body text-text-secondary">{messages[stage || 'generating'] || 'Working...'}</p>
    </div>
  )
}
