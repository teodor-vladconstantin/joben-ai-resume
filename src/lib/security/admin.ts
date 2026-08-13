export function parseAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS || ''
  return new Set(
    raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
}
