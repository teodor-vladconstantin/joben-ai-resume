import { beforeEach, describe, expect, it, vi } from 'vitest'

const callAnthropicMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn().mockResolvedValue({ userId: 'user_1', sessionClaims: {} }) }))
vi.mock('@/lib/plans', () => ({ getUserPlan: vi.fn().mockResolvedValue('pro'), getEmailHintFromSessionClaims: () => undefined }))
vi.mock('@/lib/email-automation', () => ({ sendRateLimitEmailIfEligible: vi.fn() }))
// Tool diff needs the parser service; the number check alone is under test here.
vi.mock('@/lib/resume-parser-client', () => ({ callResumeParserJson: vi.fn().mockRejectedValue(new Error('offline')) }))
vi.mock('@/lib/anthropic-with-limits', () => ({
  callAnthropicWithLimits: callAnthropicMock,
  extractTextFromAnthropicMessage: (message: { text: string }) => message.text,
  isRateLimitExceededError: () => false,
}))

function seniorResume(jobs: number) {
  return {
    personal: { firstName: 'Ana', lastName: 'Pop', title: 'Staff Engineer', summary: '' },
    experience: Array.from({ length: jobs }, (_, i) => ({
      id: `exp_${i}`,
      title: 'Senior Software Engineer',
      company: `Company${i} SRL`,
      period: `Jan ${2024 - 2 * i} - Dec ${2025 - 2 * i}`,
      startYear: 2024 - 2 * i,
      description: '',
      bullets: Array.from({ length: 8 }, (_, b) => `Built service ${b} handling payments reconciliation for ${b + 2} teams across three regions with on-call ownership`),
    })),
    education: [{ id: 'e', institution: 'UPB', degree: 'BSc', field: 'CS' }],
    dynamicSections: [{ id: 's', type: 'skills', title: 'Skills', content: 'Go, TypeScript, PostgreSQL, Kafka, AWS' }],
  }
}

async function generate(resumeData: unknown) {
  const { POST } = await import('@/app/api/generate-summary/route')
  const response = await POST(
    new Request('http://localhost/api/generate-summary', { method: 'POST', body: JSON.stringify({ mode: 'resume', resumeData }) })
  )
  return { status: response.status, body: (await response.json()) as { summary?: string; newClaims?: string[]; error?: string } }
}

describe('/api/generate-summary', () => {
  beforeEach(() => {
    vi.resetModules()
    callAnthropicMock.mockReset()
  })

  it('flags details the resume never states', async () => {
    callAnthropicMock.mockResolvedValue({ text: 'Staff engineer with 15 years in payments. Led teams across three regions.' })
    const { status, body } = await generate(seniorResume(3))
    expect(status).toBe(200)
    expect(body.newClaims).toEqual(['15'])
  })

  it('does not flag the real career span it was given', async () => {
    callAnthropicMock.mockResolvedValue({ text: `Staff engineer with ${new Date().getFullYear() - 2020} years in payments.` })
    const { body } = await generate(seniorResume(3))
    expect(body.newClaims).toEqual([])
  })

  it('accepts a 10-role senior resume instead of rejecting it as too long', async () => {
    callAnthropicMock.mockResolvedValue({ text: 'Staff engineer focused on payments.' })
    const { status, body } = await generate(seniorResume(10))
    expect(body.error).toBeUndefined()
    expect(status).toBe(200)
  })
})
