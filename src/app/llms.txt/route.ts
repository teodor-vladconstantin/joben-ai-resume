import { buildLlmsTxt, textResponse } from '@/lib/llms'

// Static, one file per locale. Sourced from the ro content.
export const dynamic = 'force-static'

export function GET() {
  return textResponse(buildLlmsTxt('ro'))
}
