import { beforeEach, describe, expect, it, vi } from 'vitest'

let lookup: { data: unknown; error: { message: string } | null } = { data: null, error: null }

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => lookup }) }),
    }),
  }),
}))
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))

describe('isEmailSuppressed', () => {
  beforeEach(() => {
    lookup = { data: null, error: null }
  })

  it('is false for an address that is not suppressed and true for one that is', async () => {
    const { isEmailSuppressed } = await import('@/lib/email-suppression')
    await expect(isEmailSuppressed('a@b.ro')).resolves.toBe(false)

    lookup = { data: { email: 'a@b.ro' }, error: null }
    await expect(isEmailSuppressed('a@b.ro')).resolves.toBe(true)
  })

  it('fails closed: a lookup error throws instead of reporting "not suppressed"', async () => {
    const { isEmailSuppressed } = await import('@/lib/email-suppression')
    lookup = { data: null, error: { message: 'connection reset' } }

    await expect(isEmailSuppressed('a@b.ro')).rejects.toThrow('connection reset')
  })
})

describe('sendEmail when the suppression check is unavailable', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-secret-test-secret-test-secret')
  })

  it('reports a failed send (so crons retry) and never calls Resend', async () => {
    const sendMock = vi.fn()
    vi.doMock('resend', () => ({ Resend: class { emails = { send: sendMock } } }))
    vi.doMock('@/lib/email-suppression', () => ({
      isEmailSuppressed: async () => {
        throw new Error('db down')
      },
    }))

    const { sendWelcomeEmail } = await import('@/lib/resend')
    const result = await sendWelcomeEmail({ to: 'a@b.ro', name: 'Ana', locale: 'ro' } as never)

    expect(result).toMatchObject({ success: false })
    expect(sendMock).not.toHaveBeenCalled()
  })
})
