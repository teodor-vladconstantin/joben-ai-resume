import { createServerClient } from '@/lib/supabase/server'
import { normalizeEmail } from '@/lib/security/disposable-email'
import { logger } from '@/lib/logger'

// Fails closed: a lookup error throws instead of answering "not suppressed".
// Mailing someone who unsubscribed (or whose address bounced) is worse than
// delaying one message during a Supabase outage. sendEmail turns the throw
// into a failed send so cron callers retry instead of marking it delivered.
export async function isEmailSuppressed(email: string | null | undefined): Promise<boolean> {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('email_suppressions')
    .select('email')
    .eq('email', normalized)
    .maybeSingle()

  if (error) throw new Error(`Email suppression lookup failed: ${error.message}`)

  return Boolean(data)
}

export async function suppressEmail(email: string, reason: string): Promise<void> {
  const normalized = normalizeEmail(email)
  if (!normalized) return

  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('email_suppressions')
      .upsert({ email: normalized, reason }, { onConflict: 'email', ignoreDuplicates: true })

    if (error) {
      logger.warn('Failed to record email suppression', { source: 'suppressEmail', error: error.message })
    }
  } catch (error) {
    logger.warn('Email suppression insert threw', {
      source: 'suppressEmail',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
