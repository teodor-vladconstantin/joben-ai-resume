import { render } from '@react-email/render'
import { describe, expect, it } from 'vitest'
import { Layout } from '@/emails/Layout'

describe('Layout', () => {
  it('renders logo, localized legal links, copyright and company identification', async () => {
    const html = await render(<Layout locale="ro">x</Layout>)
    expect(html).toContain('/jobeneu_logo.jpg')
    expect(html).toContain('/ro/terms')
    expect(html).toContain('/ro/privacy')
    expect(html).toContain('TETA ABC SRL')
    expect(html).toContain('22404824')
    expect(html).toContain(String(new Date().getFullYear()))
  })
})
