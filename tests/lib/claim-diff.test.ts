import { afterEach, describe, expect, it, vi } from 'vitest'
import { findNewNumberClaims } from '@/lib/claim-diff'

describe('findNewNumberClaims', () => {
  it('flags a number that appears nowhere in the source', () => {
    expect(findNewNumberClaims('Improved deployment speed', '', 'Improved deployment speed by 45%')).toEqual([
      '45%',
    ])
  })

  it('does not flag a number that was merely reformatted (27 -> 27%)', () => {
    expect(findNewNumberClaims('Increased sales by 27', '', 'Increased sales by 27%')).toEqual([])
  })

  it('does not flag a number moved in from another bullet in the same job (context)', () => {
    const original = 'Led the backend migration'
    const context = 'Reduced latency by 30%\nShipped the new API'
    const rewritten = 'Led the backend migration, reducing latency by 30%'
    expect(findNewNumberClaims(original, context, rewritten)).toEqual([])
  })

  it('dedupes repeated new numbers', () => {
    expect(findNewNumberClaims('', '', 'Grew revenue 20% and margin 20%')).toEqual(['20%'])
  })

  it('returns an empty array when the rewrite introduces no numbers', () => {
    expect(findNewNumberClaims('Built the onboarding flow', '', 'Redesigned the onboarding flow')).toEqual([])
  })

  it('flags multiple distinct new numbers', () => {
    expect(findNewNumberClaims('Managed a team', '', 'Managed a team of 12 across 3 offices')).toEqual([
      '12',
      '3',
    ])
  })
})

describe('findNewClaims', () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock('@/lib/resume-parser-client')
  })

  it('falls back to number-only detection when the resume-parser call fails', async () => {
    vi.doMock('@/lib/resume-parser-client', () => ({
      callResumeParserJson: vi.fn().mockRejectedValue(new Error('parser unreachable')),
    }))
    const { findNewClaims } = await import('@/lib/claim-diff')

    const claims = await findNewClaims('Built APIs', '', 'Built APIs, cutting response time by 40%')
    expect(claims).toEqual(['40%'])
  })

  it('adds new tools/technologies found via the skill extractor', async () => {
    vi.doMock('@/lib/resume-parser-client', () => ({
      callResumeParserJson: vi.fn().mockImplementation(async (_path: string, body: { text: string }) => {
        if (body.text.includes('Kubernetes')) return { skills: ['Kubernetes'] }
        return { skills: [] }
      }),
    }))
    const { findNewClaims } = await import('@/lib/claim-diff')

    const claims = await findNewClaims('Deployed the service', '', 'Deployed the service using Kubernetes')
    expect(claims).toContain('Kubernetes')
  })

  it('does not flag a tool that already appears in the context', async () => {
    vi.doMock('@/lib/resume-parser-client', () => ({
      callResumeParserJson: vi.fn().mockImplementation(async (_path: string, body: { text: string }) => {
        if (body.text.includes('Kubernetes')) return { skills: ['Kubernetes'] }
        return { skills: [] }
      }),
    }))
    const { findNewClaims } = await import('@/lib/claim-diff')

    const claims = await findNewClaims(
      'Deployed the service',
      'Managed the Kubernetes cluster',
      'Deployed the service using Kubernetes'
    )
    expect(claims).not.toContain('Kubernetes')
  })
})
