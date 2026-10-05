import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { runWithClaimRelease, setClaim } from '@/lib/webhook-claim'

function fakeSupabase() {
  const eq2 = vi.fn().mockResolvedValue({ error: null })
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  const del = vi.fn().mockReturnValue({ eq: eq1 })
  const from = vi.fn().mockReturnValue({ delete: del })
  return { client: { from } as unknown as SupabaseClient, del }
}

describe('runWithClaimRelease', () => {
  it('releases the claim on a 5xx response', async () => {
    const { client, del } = fakeSupabase()
    const res = await runWithClaimRelease(async (ctx) => {
      setClaim(ctx, client, 'stripe', 'evt_1')
      return new Response('x', { status: 500 })
    })
    expect(res.status).toBe(500)
    expect(del).toHaveBeenCalledTimes(1)
  })

  it('releases the claim when the handler throws', async () => {
    const { client, del } = fakeSupabase()
    await expect(
      runWithClaimRelease(async (ctx) => {
        setClaim(ctx, client, 'stripe', 'evt_1')
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')
    expect(del).toHaveBeenCalledTimes(1)
  })

  it('keeps the claim on success', async () => {
    const { client, del } = fakeSupabase()
    await runWithClaimRelease(async (ctx) => {
      setClaim(ctx, client, 'stripe', 'evt_1')
      return new Response('ok', { status: 200 })
    })
    expect(del).not.toHaveBeenCalled()
  })
})
