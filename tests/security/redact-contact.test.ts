import { describe, expect, it } from 'vitest'

import { isContactRedactionEnabled, redactContactInfo } from '@/lib/security/redact-contact'

describe('redactContactInfo', () => {
  it('replaces emails, phones and profile links with placeholders', () => {
    const input = [
      'Ion Popescu',
      'ion.popescu+cv@example.com | +40 722 123 456 | 0722.123.456',
      'linkedin.com/in/ion-popescu | https://github.com/ion | www.ion.ro',
    ].join('\n')
    const out = redactContactInfo(input)
    expect(out).not.toMatch(/example\.com|722|linkedin|github|ion\.ro/)
    expect(out).toContain('[EMAIL]')
    expect(out).toContain('[PHONE]')
    expect(out).toContain('[LINK]')
    expect(out).toContain('Ion Popescu')
  })

  it('leaves years, scores and short numbers alone', () => {
    const text = 'Increased revenue by 45% between 2019-2023 and managed 12 people, 2 teams.'
    expect(redactContactInfo(text)).toBe(text)
  })

  it('is off unless AI_REDACT_CONTACT=true', () => {
    expect(isContactRedactionEnabled({})).toBe(false)
    expect(isContactRedactionEnabled({ AI_REDACT_CONTACT: 'false' })).toBe(false)
    expect(isContactRedactionEnabled({ AI_REDACT_CONTACT: 'true' })).toBe(true)
  })
})
