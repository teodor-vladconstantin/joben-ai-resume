// Retention windows promised in the Privacy Policy (messages/*.json, Legal.privacy).
// Change a window here and in the policy together.
export type RetentionRule = {
  table: string
  days: number
  // Extra filter so only rows nobody owns are removed (anonymous visitors).
  unownedColumn?: string
}

export const RETENTION_RULES: readonly RetentionRule[] = [
  { table: 'anonymous_scans', days: 90, unownedColumn: 'claimed_by' },
  { table: 'signup_consents', days: 30 },
  { table: 'email_events', days: 365 },
  { table: 'product_events', days: 365 },
  { table: 'webhook_events', days: 365 },
  { table: 'feedback', days: 730 },
  { table: 'social_leads', days: 90 },
]

export function retentionCutoff(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}
