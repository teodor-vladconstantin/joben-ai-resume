import { describe, expect, it } from 'vitest'
import { analyzeSchema } from '@/lib/validation/schemas'

const base = { resumeText: 'Jane Doe, Software Engineer', jobDescription: 'Backend role', locale: 'en' }

describe('analyzeSchema resumeId', () => {
  it('accepts an uploaded PDF payload without resumeId', () => {
    const parsed = analyzeSchema.safeParse(base)
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.resumeId).toBeUndefined()
  })

  it('accepts resumeId: null from older clients and normalizes it to undefined', () => {
    const parsed = analyzeSchema.safeParse({ ...base, resumeId: null })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.resumeId).toBeUndefined()
  })

  it('keeps a saved resume id', () => {
    const parsed = analyzeSchema.safeParse({ ...base, resumeId: '3f2b9c1e-5a7d-4e1b-9c2a-1b2c3d4e5f60' })
    expect(parsed.success && parsed.data.resumeId).toBe('3f2b9c1e-5a7d-4e1b-9c2a-1b2c3d4e5f60')
  })

  it('still rejects a malformed resumeId', () => {
    expect(analyzeSchema.safeParse({ ...base, resumeId: 'bad id!' }).success).toBe(false)
  })
})
