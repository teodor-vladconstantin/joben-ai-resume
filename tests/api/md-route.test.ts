import { describe, expect, it } from 'vitest'
import { GET } from '@/app/md/[slug]/route'
import { GET as llms } from '@/app/llms.txt/route'

const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) })

describe('/md route', () => {
  it('returns markdown with Vary: Accept for home', async () => {
    const res = await GET(new Request('http://x/md/home-en'), ctx('home-en'))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/markdown')
    expect(res.headers.get('vary')).toBe('Accept')
    expect((await res.text()).startsWith('# Joben')).toBe(true)
  })
  it('returns a 404 markdown body otherwise', async () => {
    const res = await GET(new Request('http://x/md/not-found'), ctx('not-found'))
    expect(res.status).toBe(404)
    expect(res.headers.get('content-type')).toContain('text/markdown')
  })
})

describe('llms.txt', () => {
  it('has when-to-use guidance and contact link', async () => {
    const body = await llms().text()
    expect(body).toContain('## When to use Joben')
    expect(body).toContain('/ro/contact')
  })
})
