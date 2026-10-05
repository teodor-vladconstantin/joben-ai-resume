import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isAuthorizedCronRequest } from '@/lib/cron-utils'

const req = (headers: Record<string, string>) => new Request('http://localhost/api/cron/x', { headers })

describe('isAuthorizedCronRequest', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'correct-secret'
  })
  afterEach(() => {
    delete process.env.CRON_SECRET
  })

  it('accepts the bearer token and the x-cron-secret header', () => {
    expect(isAuthorizedCronRequest(req({ authorization: 'Bearer correct-secret' }))).toBe(true)
    expect(isAuthorizedCronRequest(req({ 'x-cron-secret': 'correct-secret' }))).toBe(true)
  })

  it('rejects wrong, same-length-wrong and missing credentials', () => {
    expect(isAuthorizedCronRequest(req({ authorization: 'Bearer wrong' }))).toBe(false)
    expect(isAuthorizedCronRequest(req({ authorization: 'Bearer correct-secreX' }))).toBe(false)
    expect(isAuthorizedCronRequest(req({}))).toBe(false)
  })

  it('rejects everything when CRON_SECRET is unset', () => {
    delete process.env.CRON_SECRET
    expect(isAuthorizedCronRequest(req({ authorization: 'Bearer ' }))).toBe(false)
  })
})
