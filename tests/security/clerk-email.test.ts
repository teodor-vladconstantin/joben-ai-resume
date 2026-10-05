import { describe, expect, it } from 'vitest'
import { getContactEmail, getVerifiedPrimaryEmail } from '@/lib/security/clerk-email'

const verified = { status: 'verified' }
const unverified = { status: 'unverified' }

describe('getVerifiedPrimaryEmail', () => {
  it('returns the verified primary address, lowercased', () => {
    expect(
      getVerifiedPrimaryEmail({
        primary_email_address_id: 'b',
        email_addresses: [
          { id: 'a', email_address: 'first@x.com', verification: verified },
          { id: 'b', email_address: 'Primary@X.com', verification: verified },
        ],
      })
    ).toBe('primary@x.com')
  })

  it('ignores a verified non-primary address and an unverified primary', () => {
    expect(
      getVerifiedPrimaryEmail({
        primary_email_address_id: 'b',
        email_addresses: [
          { id: 'a', email_address: 'owner@x.com', verification: verified },
          { id: 'b', email_address: 'attacker@x.com', verification: unverified },
        ],
      })
    ).toBeNull()
  })

  it('returns null when there is no primary id', () => {
    expect(
      getVerifiedPrimaryEmail({ email_addresses: [{ id: 'a', email_address: 'a@x.com', verification: verified }] })
    ).toBeNull()
  })
})

describe('getContactEmail', () => {
  it('falls back to the first address when no primary is set', () => {
    expect(getContactEmail({ email_addresses: [{ id: 'a', email_address: 'A@x.com' }] })).toBe('a@x.com')
  })
})
