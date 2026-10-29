import { describe, expect, it } from 'vitest'
import { emailLayout, UNSUBSCRIBE_MARKER } from '@/lib/email-layout'

describe('emailLayout', () => {
  it('includes logo, legal links, copyright and company identification', () => {
    const html = emailLayout({ locale: 'ro', heading: 'Salut', bodyHtml: '<p>x</p>' })
    expect(html).toContain('/jobeneu_logo.jpg')
    expect(html).toContain('/ro/terms')
    expect(html).toContain('/ro/privacy')
    expect(html).toContain(`&copy; ${new Date().getFullYear()} TETA ABC SRL`)
    expect(html).toContain('22404824')
    expect(html).toContain(UNSUBSCRIBE_MARKER)
  })

  it('omits the unsubscribe marker for transactional emails', () => {
    expect(emailLayout({ heading: 'x', bodyHtml: '', unsubscribe: false })).not.toContain(UNSUBSCRIBE_MARKER)
  })
})
