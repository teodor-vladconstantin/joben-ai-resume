import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const getUserPlanMock = vi.fn()
const getEmailHintFromSessionClaimsMock = vi.fn()
const createMessageMock = vi.fn()
const callResumeParserJsonMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}))

vi.mock('@/lib/plans', () => ({
  getUserPlan: getUserPlanMock,
  getEmailHintFromSessionClaims: getEmailHintFromSessionClaimsMock,
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    messages = { create: createMessageMock }
  },
}))

vi.mock('@/lib/resume-parser-client', () => ({
  callResumeParserJson: callResumeParserJsonMock,
}))

vi.mock('@/lib/ratelimit', () => ({
  checkAndReserveTokens: vi.fn().mockResolvedValue({ allowed: true }),
  checkFeatureLimit: vi.fn().mockResolvedValue({ allowed: true, used: 0, limit: 30, blocked: false }),
  getMonthlyResetAtIso: vi.fn().mockReturnValue('2026-05-01T00:00:00Z'),
  getPlanLimits: vi.fn().mockReturnValue({
    tokenBudget: 60_000,
    hardCapTokens: 1_500_000,
    maxInputTokensPerCall: 8_000,
    maxOutputTokensPerCall: 2_000,
    maxRawChars: 32_000,
    covers: 5,
    jds: 5,
    bullets: 30,
    cvs: 1,
  }),
  getRateLimitStatus: vi.fn().mockResolvedValue({ tokens: { remaining: 1200 } }),
  incrementFeatureCounter: vi.fn(),
  recordLimitHit: vi.fn(),
  recordTokenUsage: vi.fn(),
}))

function buildResumeData() {
  return {
    personal: { firstName: 'A', lastName: 'B', summary: '' },
    experience: [
      {
        id: 'job-founder',
        title: 'Founder',
        company: 'Joben.eu',
        period: '2023 - Present',
        description: '',
        bullets: ['Built an AI resume parser using Claude and prompt engineering.'],
      },
      {
        id: 'job-tech-director',
        title: 'Tech Director',
        company: 'Acme Corp',
        period: '2020 - 2023',
        description: '',
        bullets: ['Owned backend architecture for a Node.js microservices platform.'],
      },
      {
        id: 'job-mentor',
        title: 'Tech Mentor',
        company: 'Bootcamp',
        period: '2018 - 2020',
        description: '',
        bullets: ['Mentored 20+ junior developers in full-stack development.'],
      },
    ],
  }
}

function mockClaudeReply(json: unknown) {
  createMessageMock.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(json) }],
    usage: { input_tokens: 100, output_tokens: 80 },
  })
}

async function postTailor(resumeData: unknown, jobDescription = 'Looking for a strong generalist engineer') {
  const { POST } = await import('@/app/api/tailor/route')
  return POST(
    new Request('http://localhost/api/tailor', {
      method: 'POST',
      body: JSON.stringify({ resumeData, jobDescription }),
    })
  )
}

describe('POST /api/tailor — job/bullet mapping', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset().mockResolvedValue({ userId: 'user_1', sessionClaims: {} })
    getUserPlanMock.mockReset().mockResolvedValue('pro')
    getEmailHintFromSessionClaimsMock.mockReset().mockReturnValue(undefined)
    createMessageMock.mockReset()
    callResumeParserJsonMock.mockReset().mockResolvedValue({ skills: [] })
  })

  it('maps each rewritten bullet back to its explicit jobIndex/bulletIndex, not array position', async () => {
    // Deliberately out of "natural" order — job 2 first, job 0 second — to
    // prove the route doesn't assume result order matches job order.
    mockClaudeReply({
      updatedBullets: [
        { jobIndex: 2, bulletIndex: 0, text: 'Mentored 25+ developers, focused on full-stack best practices.' },
        { jobIndex: 0, bulletIndex: 0, text: 'Built an AI resume parser leveraging Claude and advanced prompt engineering.' },
      ],
      summary: 'Tailored summary',
    })

    const response = await postTailor(buildResumeData())
    expect(response.status).toBe(200)

    const body = await response.json()
    const updated = body.result.updatedBullets as Array<{ jobIndex: number; bulletIndex: number; text: string }>

    const mentorBullet = updated.find((item) => item.jobIndex === 2)
    const founderBullet = updated.find((item) => item.jobIndex === 0)

    expect(mentorBullet?.text).toContain('Mentored')
    expect(founderBullet?.text).toContain('AI resume parser')
    // Tech Director (jobIndex 1) was never rewritten by Claude — must not appear.
    expect(updated.find((item) => item.jobIndex === 1)).toBeUndefined()
  })

  it('drops a rewritten bullet with an out-of-range jobIndex/bulletIndex instead of crashing or misapplying it', async () => {
    mockClaudeReply({
      updatedBullets: [
        { jobIndex: 99, bulletIndex: 0, text: 'Hallucinated job.' },
        { jobIndex: 0, bulletIndex: 5, text: 'Hallucinated bullet index.' },
        { jobIndex: 1, bulletIndex: 0, text: 'Owned backend architecture for a platform serving 2M users.' },
      ],
      summary: '',
    })

    const response = await postTailor(buildResumeData())
    expect(response.status).toBe(200)

    const body = await response.json()
    const updated = body.result.updatedBullets as Array<{ jobIndex: number; bulletIndex: number }>

    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({ jobIndex: 1, bulletIndex: 0 })
  })

  it('computes the anti-hallucination context from the bullet\'s own job only, not other jobs', async () => {
    // Job 1 (Tech Director) has no numbers of its own; Claude's rewrite
    // introduces "40%". Job 0 (Founder) separately mentions "40%" in its own
    // bullets — that must NOT suppress the flag on job 1's bullet.
    mockClaudeReply({
      updatedBullets: [
        { jobIndex: 1, bulletIndex: 0, text: 'Owned backend architecture, improving throughput by 40%.' },
      ],
      summary: '',
    })

    const resumeData = buildResumeData()
    resumeData.experience[0].bullets.push('Cut onboarding time by 40% using automation.')

    const response = await postTailor(resumeData)
    const body = await response.json()
    const updated = body.result.updatedBullets as Array<{ jobIndex: number; newClaims: string[] }>

    expect(updated[0].newClaims).toContain('40%')
  })

  it('does not flag a number that already exists elsewhere in the same job (sibling bullet context)', async () => {
    mockClaudeReply({
      updatedBullets: [
        { jobIndex: 1, bulletIndex: 0, text: 'Owned backend architecture, improving throughput by 40%.' },
      ],
      summary: '',
    })

    const resumeData = buildResumeData()
    // Same job (index 1) already mentions 40% in a sibling bullet.
    resumeData.experience[1].bullets.push('Cited in a case study for a 40% latency reduction.')

    const response = await postTailor(resumeData)
    const body = await response.json()
    const updated = body.result.updatedBullets as Array<{ jobIndex: number; newClaims: string[] }>

    expect(updated[0].newClaims).not.toContain('40%')
  })
})
