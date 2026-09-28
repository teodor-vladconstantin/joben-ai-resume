import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_test_123', sessionClaims: {} }),
}))
vi.mock('@/lib/plans', () => ({
  getEmailHintFromSessionClaims: () => undefined,
  getUserPlan: vi.fn().mockResolvedValue('pro'),
  checkResumeExportQuota: vi.fn().mockResolvedValue({ allowed: true }),
}))
vi.mock('@/lib/security/route-rate-limit', () => ({
  checkRouteRateLimit: vi.fn().mockResolvedValue({ ok: true, retryAfter: 0 }),
  resolveRateLimitIdentity: () => 'user:test',
}))
vi.mock('@/lib/analytics', () => ({ trackProductEvent: vi.fn() }))
vi.mock('@/lib/posthog-server', () => ({ capturePostHogEvent: vi.fn() }))

async function exportTex(data: unknown): Promise<string> {
  const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array([37, 80, 68, 70]), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const { POST } = await import('@/app/api/resumes/export-latex/route')
  const response = await POST(
    new Request('http://localhost/api/resumes/export-latex', {
      method: 'POST',
      body: JSON.stringify({ data }),
    })
  )
  expect(response.status).toBe(200)
  return JSON.parse(fetchMock.mock.calls[0][1].body as string).tex as string
}

describe('/api/resumes/export-latex', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('cannot break out of \\href with a crafted URL', async () => {
    const tex = await exportTex({
      personal: { firstName: 'A', lastName: 'B', website: 'evil.com/}\\input{/etc/passwd}%#' },
      experience: [],
      projects: [{ name: 'P', url: 'https://x.io/a}\\input{/proc/self/environ}' }],
    })
    expect(tex).not.toContain('\\input{')
    const hrefs = tex.match(/\\href\{[^}]*\}/g) ?? []
    expect(hrefs).toEqual([
      '\\href{https://evil.com/input/etc/passwd\\%\\#}',
      '\\href{https://x.io/ainput/proc/self/environ}',
    ])
  })

  it('exports long bullets, all technologies and custom section titles without truncation', async () => {
    const longBullet = `Led ${'the migration of legacy services '.repeat(12)}to Kubernetes`
    const techs = Array.from({ length: 12 }, (_, i) => `Tech${i}`)
    const tex = await exportTex({
      personal: { firstName: 'Ana', lastName: 'Pop', summary: 'Line one\nLine two' },
      experience: [
        { title: 'Engineer', company: 'Acme', period: '2020 - 2022', description: '', bullets: [longBullet] },
        { title: '', company: '', description: '', bullets: [] },
      ],
      projects: [{ name: 'Proj', technologies: techs, bullets: Array.from({ length: 10 }, (_, i) => `Bullet ${i}`) }],
      dynamicSections: [
        { type: 'leadership', title: 'Volunteering', content: 'Red Cross\nFood bank' },
        { type: 'languages', title: 'Limbi', content: 'Română (nativ)' },
      ],
    })
    expect(tex).toContain(longBullet)
    expect(tex).toContain('Tech11')
    expect(tex).toContain('Bullet 9')
    expect(tex).toContain('\\section{Volunteering}')
    expect(tex).toContain('Red Cross \\\\\nFood bank')
    expect(tex).toContain('\\section{Limbi}')
    expect(tex).toContain('Line one \\\\\nLine two')
    expect(tex).toContain('\\ifPDFTeX\\else\\usepackage{fontspec}\\fi')
    // 1 macro definition + Engineer + Proj; the blank experience card is skipped.
    expect(tex.match(/\\resumeSubheading/g)).toHaveLength(3)
  })
})
