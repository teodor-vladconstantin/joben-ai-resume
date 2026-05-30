export default function AiReviewLoading() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-border-soft border-t-text-muted rounded-full animate-spin" />
        <p className="text-text-muted text-small">Loading AI review&hellip;</p>
      </div>
    </div>
  )
}
