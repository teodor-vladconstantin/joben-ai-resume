import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@react-email/render'
import { Layout } from '@/emails/Layout'
import { SimpleBody } from '@/emails/bodies'

describe('email layout', () => {
  it('renders CTA, escapes text and keeps the unsubscribe link', async () => {
    const html = await render(
      // eslint-disable-next-line react/no-children-prop -- .ts file, no JSX
      createElement(Layout, {
        unsubscribe: { url: 'https://x.test/u?t=1', label: 'Unsub' },
        children: createElement(SimpleBody, { heading: 'Hi <b>', paragraphs: ['p'], ctaHref: 'https://x.test/go', ctaLabel: 'Go' }),
      }),
    )
    expect(html).toContain('https://x.test/u?t=1')
    expect(html).toContain('https://x.test/go')
    expect(html).toContain('#047857')
    expect(html).not.toContain('<b>')
  })
})
