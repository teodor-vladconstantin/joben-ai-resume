import { describe, expect, it } from 'vitest'
import { parseAtsSignupAttribution, readAtsSignupAttribution } from '@/lib/ats-attribution'

const SCAN = '11111111-2222-3333-4444-555555555555'

describe('parseAtsSignupAttribution', () => {
  it('maps result page, rate-limited and email CTAs to a source', () => {
    expect(parseAtsSignupAttribution(new URLSearchParams(`from=ats&scan=${SCAN}`))).toEqual({ source: 'result_page', scanId: SCAN })
    expect(parseAtsSignupAttribution(new URLSearchParams('from=ats_rate_limited'))).toEqual({ source: 'rate_limited', scanId: null })
    expect(
      parseAtsSignupAttribution(new URLSearchParams(`utm_source=email&utm_campaign=anon_scan_48h&scan=${SCAN}`))
    ).toEqual({ source: 'email_48h', scanId: SCAN })
  })

  it('ignores unrelated visits and malformed scan ids', () => {
    expect(parseAtsSignupAttribution(new URLSearchParams(''))).toBeNull()
    expect(parseAtsSignupAttribution(new URLSearchParams('utm_source=email&utm_campaign=newsletter'))).toBeNull()
    expect(parseAtsSignupAttribution(new URLSearchParams('from=ats&scan=not-a-uuid'))).toEqual({ source: 'result_page', scanId: null })
  })
})

describe('readAtsSignupAttribution', () => {
  it('accepts only known sources and uuid scan ids from user-editable metadata', () => {
    expect(readAtsSignupAttribution({ atsSource: 'email_report', atsScanId: SCAN })).toEqual({ source: 'email_report', scanId: SCAN })
    expect(readAtsSignupAttribution({ atsSource: 'admin', atsScanId: SCAN })).toBeNull()
    expect(readAtsSignupAttribution({ atsSource: 'result_page', atsScanId: "x' or 1=1" })).toEqual({ source: 'result_page', scanId: null })
    expect(readAtsSignupAttribution(null)).toBeNull()
  })
})
