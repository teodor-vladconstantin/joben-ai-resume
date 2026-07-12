import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const createServerClientMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

type EqCall = { table: string; column: string; value: unknown }

let eqCalls: EqCall[] = []

// The only table the route reads via `.maybeSingle()`; every other table is
// a list query. Keyed off the table name (not the mock data) so an error
// case (data: null) still exercises the correct query shape.
const SINGLE_TABLES = new Set(['users'])

/**
 * Builds a mock Supabase table query chain and records every `.eq()` call
 * (table + column + value) so tests can assert the route scoped each query
 * to the correct owner column. Since this route uses the service-role key
 * (which bypasses RLS), the `.eq()` calls are the entire security boundary.
 */
function mockTable(
  table: string,
  data: unknown[] | Record<string, unknown> | null,
  error: { message: string } | null = null
) {
  const isSingle = SINGLE_TABLES.has(table)
  return {
    select: vi.fn(() => ({
      eq: vi.fn((column: string, value: unknown) => {
        eqCalls.push({ table, column, value })
        if (isSingle) {
          return {
            maybeSingle: vi.fn().mockResolvedValue({ data, error }),
          }
        }
        return Promise.resolve({ data, error })
      }),
    })),
  }
}

const EXPECTED_SCOPING: EqCall[] = [
  { table: 'users', column: 'clerk_id', value: 'user_123' },
  { table: 'resumes', column: 'user_id', value: 'user_123' },
  { table: 'cover_letters', column: 'user_id', value: 'user_123' },
  { table: 'ai_reviews', column: 'user_id', value: 'user_123' },
  { table: 'resume_analyses', column: 'user_id', value: 'user_123' },
  { table: 'feedback', column: 'user_id', value: 'user_123' },
  { table: 'email_events', column: 'user_clerk_id', value: 'user_123' },
]

const MOCK_DATA: Record<string, unknown[] | Record<string, unknown>> = {
  users: { clerk_id: 'user_123', email: 'a@example.com' },
  resumes: [{ id: 'resume_1', user_id: 'user_123' }],
  cover_letters: [{ id: 'cl_1', user_id: 'user_123' }],
  ai_reviews: [{ id: 'ar_1', user_id: 'user_123' }],
  resume_analyses: [{ id: 'ra_1', user_id: 'user_123' }],
  feedback: [{ id: 'fb_1', user_id: 'user_123' }],
  email_events: [{ id: 'ee_1', user_clerk_id: 'user_123' }],
}

describe('GET /api/account/export', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    createServerClientMock.mockReset()
    eqCalls = []
  })

  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { GET } = await import('@/app/api/account/export/route')

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns a downloadable JSON export on success', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    createServerClientMock.mockReturnValue({
      from: vi.fn((table: string) => mockTable(table, MOCK_DATA[table] ?? [])),
    })

    const { GET } = await import('@/app/api/account/export/route')
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    const body = await response.json()
    expect(body.account.email).toBe('a@example.com')
    expect(body.format).toBe('joben-gdpr-export-v1')
    expect(body.resumes).toEqual(MOCK_DATA.resumes)
    expect(body.coverLetters).toEqual(MOCK_DATA.cover_letters)
    expect(body.aiReviews).toEqual(MOCK_DATA.ai_reviews)
    expect(body.resumeAnalyses).toEqual(MOCK_DATA.resume_analyses)
    expect(body.feedback).toEqual(MOCK_DATA.feedback)
    expect(body.emailEvents).toEqual(MOCK_DATA.email_events)
  })

  it('scopes every table query to the signed-in user via the correct owner column', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    createServerClientMock.mockReturnValue({
      from: vi.fn((table: string) => mockTable(table, MOCK_DATA[table] ?? [])),
    })

    const { GET } = await import('@/app/api/account/export/route')
    await GET()

    expect(eqCalls).toHaveLength(EXPECTED_SCOPING.length)
    for (const expected of EXPECTED_SCOPING) {
      expect(eqCalls).toContainEqual(expected)
    }
  })

  it('returns a 500 apiError (not a partial export) when a query fails', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    createServerClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'resumes') {
          return mockTable(table, null, { message: 'connection reset' })
        }
        return mockTable(table, MOCK_DATA[table] ?? [])
      }),
    })

    const { GET } = await import('@/app/api/account/export/route')
    const response = await GET()

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body).toEqual({ success: false, error: 'Could not generate your data export.' })
    expect(body.resumes).toBeUndefined()
    expect(body.account).toBeUndefined()
  })
})
