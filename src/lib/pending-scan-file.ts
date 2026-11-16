// A file dropped on the homepage hero is handed to the checker page through this
// module-level slot (client-side navigation keeps module state). Lost on a full reload.
let pending: File | null = null

export function setPendingScanFile(file: File) {
  pending = file
}

export function takePendingScanFile(): File | null {
  const file = pending
  pending = null
  return file
}
