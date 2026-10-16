import { buildLlmsFull, textResponse } from '@/lib/llms'

// Static, one file per locale. Sourced from the en content.
export const dynamic = 'force-static'

export function GET() {
  return textResponse(buildLlmsFull('en'))
}
