import { describe, expect, it } from 'vitest'
import { fileHasExpectedSignature, hasExpectedSignature } from '@/lib/security/file-signature'

const bytes = (s: string) => new Uint8Array(Buffer.from(s, 'latin1'))

describe('file signature', () => {
  it('accepts real PDF and DOCX headers', () => {
    expect(hasExpectedSignature(bytes('%PDF-1.7 ...'), '.pdf')).toBe(true)
    expect(hasExpectedSignature(bytes('PK\x03\x04rest'), '.docx')).toBe(true)
  })

  it('rejects mismatched, empty and unknown types', () => {
    expect(hasExpectedSignature(bytes('<html>'), '.pdf')).toBe(false)
    expect(hasExpectedSignature(bytes('%PDF-1.7'), '.docx')).toBe(false)
    expect(hasExpectedSignature(new Uint8Array(), '.pdf')).toBe(false)
    expect(hasExpectedSignature(bytes('%PDF-'), '.exe')).toBe(false)
  })

  it('reads the header from a File', async () => {
    expect(await fileHasExpectedSignature(new File(['%PDF-1.4'], 'a.pdf'), '.pdf')).toBe(true)
    expect(await fileHasExpectedSignature(new File(['MZ binary'], 'a.pdf'), '.pdf')).toBe(false)
  })
})
