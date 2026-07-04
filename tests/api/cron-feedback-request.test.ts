import { beforeEach, describe, expect, it, vi } from 'vitest'

const createServerClientMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  builder.select = chain
  builder.eq = chain
  builder.in = chain
  builder.gte = chain
  builder.lte = chain
  builder.limit = chain
  builder.maybeSingle = () => Promise.resolve(result)
  builder.then = (resolve: (value: typeof result) => unknown) => resolve(result)
  return builder
}

describe('feedback-request cron', () => {
  beforeEach(() => {
    vi.resetModules()
    createServerClientMock.mockReset()
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  it('returns 401 when the cron secret is missing or wrong', async () => {
    const { POST } = await import('@/app/api/cron/feedback-request/route')

    const response = await POST(
      new Request('http://localhost/api/cron/feedback-request', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong-secret' },
      })
    )

    expect(response.status).toBe(401)
  })

  it('dry run reports scanned candidates from both event windows without sending', async () => {
    const createdEvent = {
      id: 'evt-created-1',
      user_clerk_id: 'user_1',
      event_name: 'resume_created',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    }
    const downloadedEvent = {
      id: 'evt-download-1',
      user_clerk_id: 'user_2',
      event_name: 'resume_exported_pdf',
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    }

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(makeQueryBuilder({ data: [createdEvent], error: null }))
      .mockReturnValueOnce(makeQueryBuilder({ data: [downloadedEvent], error: null }))

    createServerClientMock.mockReturnValue({ from: fromMock })

    const { POST } = await import('@/app/api/cron/feedback-request/route')

    const response = await POST(
      new Request('http://localhost/api/cron/feedback-request?dryRun=1', {
        method: 'POST',
        headers: { authorization: 'Bearer test-cron-secret' },
      })
    )
    const payload = (await response.json()) as { dryRun?: boolean; scanned?: number }

    expect(response.status).toBe(200)
    expect(payload.dryRun).toBe(true)
    expect(payload.scanned).toBe(2)
    expect(fromMock).toHaveBeenCalledTimes(2)
  })
})
