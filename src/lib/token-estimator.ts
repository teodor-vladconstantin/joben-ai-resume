export const AI_LIMITS = {
  resume_analysis: 4000,
  jd_comparison: 2000,
  summary_gen: 1500,
} as const

export type AIMode = keyof typeof AI_LIMITS

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

type RequestCostResult = {
  inputTokens: number
  outputTokens: number
  total: number
  withinLimit: boolean
  limitType?: 'resume_too_long' | 'jd_too_long'
  suggestedMaxChars?: number
}

export function estimateRequestCost(
  resumeText: string,
  jobDescription: string | undefined,
  mode: AIMode
): RequestCostResult {
  const resumeTokens = estimateTokens(resumeText)
  const jdTokens = jobDescription ? estimateTokens(jobDescription) : 0
  const outputTokens = 2000
  const inputTokens = resumeTokens + jdTokens
  const total = inputTokens + outputTokens
  const resumeLimit = AI_LIMITS[mode]
  const jdLimit = AI_LIMITS.jd_comparison

  if (resumeTokens > resumeLimit) {
    return {
      inputTokens,
      outputTokens,
      total,
      withinLimit: false,
      limitType: 'resume_too_long',
      suggestedMaxChars: resumeLimit * 4,
    }
  }

  if (jdTokens > jdLimit) {
    return {
      inputTokens,
      outputTokens,
      total,
      withinLimit: false,
      limitType: 'jd_too_long',
      suggestedMaxChars: jdLimit * 4,
    }
  }

  return { inputTokens, outputTokens, total, withinLimit: true }
}
