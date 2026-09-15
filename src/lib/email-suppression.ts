import { createServerClient } from '@/lib/supabase/server'
import { normalizeEmail } from '@/lib/security/disposable-email'
import { logger } from '@/lib/logger'

// Fails open (treats a lookup error as "not suppressed") for the same reason
// as this codebase's other rate-limit/quota checks: a Supabase outage should
// not silently block every outgoing email. The one deliberate fail-closed
// exception in this codebase is signup-consent (see RUNBOOK.md); this is not
// that kind of abuse gate, so it follows the default fail-open policy.
export async function isEmailSuppressed(email: string | null | undefined): Promise<boolean> {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('email_suppressions')
      .select('email')
      .eq('email', normalized)
      .maybeSingle()

    if (error) {
      logger.warn('Email suppression lookup failed', { source: 'isEmailSuppressed', error: error.message })
      return false
    }

    return Boolean(data)
  } catch (error) {
    logger.warn('Email suppression lookup threw', {
      source: 'isEmailSuppressed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return false
  }
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
