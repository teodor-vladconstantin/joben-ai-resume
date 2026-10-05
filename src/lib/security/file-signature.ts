// Extension and client-supplied MIME type are attacker controlled, so uploads
// are also checked against the file's magic bytes before any parser sees them.
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d] // %PDF-
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04] // PK\x03\x04 (DOCX is a zip)

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  return bytes.length >= magic.length && magic.every((value, index) => bytes[index] === value)
}

export function hasExpectedSignature(bytes: Uint8Array, extension: string): boolean {
  if (extension === '.pdf') return startsWith(bytes, PDF_MAGIC)
  if (extension === '.docx') return startsWith(bytes, ZIP_MAGIC)
  return false
}

export async function fileHasExpectedSignature(file: File, extension: string): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  return hasExpectedSignature(head, extension)
}
