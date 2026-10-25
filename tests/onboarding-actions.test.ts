import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authMock, maybeSingleMock, upsertMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  upsertMock: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({ auth: authMock }))
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
      upsert: upsertMock,
    }),
  }),
}))

import { dismissChecklist, getOnboardingState, markTourSeen } from '@/lib/onboarding/actions'

beforeEach(() => {
  authMock.mockReset()
  maybeSingleMock.mockReset()
  upsertMock.mockReset()
  upsertMock.mockResolvedValue({ error: null })
})

describe('getOnboardingState', () => {
  it('returns the never-start state for a signed-out visitor', async () => {
    authMock.mockResolvedValue({ userId: null })
    const state = await getOnboardingState()
    expect(state.legacy).toBe(true)
    expect(maybeSingleMock).not.toHaveBeenCalled()
  })

  it('parses the stored JSON', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: { onboarding: { tours: { editor: 'a' } } }, error: null })
    expect(await getOnboardingState()).toEqual({ legacy: false, tours: { editor: 'a' }, checklistDismissedAt: null })
  })

  it('treats a missing row as a brand-new user', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: null, error: null })
    expect((await getOnboardingState()).legacy).toBe(false)
  })

  it('never starts a tour when the read fails', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect((await getOnboardingState()).legacy).toBe(true)
  })
})

describe('markTourSeen', () => {
  it('ignores an unknown tour id without touching the database', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    await markTourSeen('settings')
    expect(maybeSingleMock).not.toHaveBeenCalled()
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('does nothing for a signed-out visitor', async () => {
    authMock.mockResolvedValue({ userId: null })
    await markTourSeen('dashboard')
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('writes the merged JSON for the caller only', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: { onboarding: { tours: { editor: 'a' } } }, error: null })
    await markTourSeen('dashboard')
    expect(upsertMock).toHaveBeenCalledWith(
      { clerk_id: 'user_1', onboarding: { tours: { editor: 'a', dashboard: expect.any(String) } } },
      { onConflict: 'clerk_id' }
    )
  })

  it('does not write when the read failed', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    await markTourSeen('dashboard')
    expect(upsertMock).not.toHaveBeenCalled()
  })
})

describe('dismissChecklist', () => {
  it('stores the dismissal time and keeps the tours', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: { onboarding: { tours: { editor: 'a' } } }, error: null })
    await dismissChecklist()
    expect(upsertMock).toHaveBeenCalledWith(
      { clerk_id: 'user_1', onboarding: { tours: { editor: 'a' }, checklistDismissedAt: expect.any(String) } },
      { onConflict: 'clerk_id' }
    )
  })
})
