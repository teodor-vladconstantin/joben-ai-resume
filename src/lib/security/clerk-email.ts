import { normalizeEmail } from '@/lib/security/disposable-email'

type ClerkEmailAddress = {
  id?: string
  email_address?: string
  verification?: { status?: string } | null
}

type ClerkUserEmailData = {
  email_addresses?: ClerkEmailAddress[]
  primary_email_address_id?: string | null
}

// The address entitlements may trust: Clerk's primary address, and only once
// Clerk reports it verified. `email_addresses[0]` is neither guaranteed to be
// primary nor verified, so it must never gate plans or "god mode".
export function getVerifiedPrimaryEmail(data: ClerkUserEmailData): string | null {
  const addresses = data.email_addresses ?? []
  const primary = data.primary_email_address_id
    ? addresses.find((address) => address.id === data.primary_email_address_id)
    : undefined

  if (!primary || primary.verification?.status !== 'verified') return null
  return normalizeEmail(primary.email_address)
}

// Best-effort address for sending mail (welcome email, cron): primary if
// known, else the first one. Never use this for authorization decisions.
export function getContactEmail(data: ClerkUserEmailData): string | null {
  const addresses = data.email_addresses ?? []
  const primary = data.primary_email_address_id
    ? addresses.find((address) => address.id === data.primary_email_address_id)
    : undefined
  return normalizeEmail((primary ?? addresses[0])?.email_address)
}
