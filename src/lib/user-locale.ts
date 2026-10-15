import { clerkClient } from '@clerk/nextjs/server'
import { routing, type AppLocale } from '@/i18n/routing'
import { logger } from '@/lib/logger'

// Language for account emails. The sign-up/sign-in pages store the UI locale
// in Clerk unsafeMetadata.locale; accounts created before that have none and
// get the site default.
export function toAppLocale(value: unknown): AppLocale {
  return typeof value === 'string' && (routing.locales as readonly string[]).includes(value)
    ? (value as AppLocale)
    : routing.defaultLocale
}

export async function getUserLocale(clerkUserId: string): Promise<AppLocale> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(clerkUserId)
    return toAppLocale(user.unsafeMetadata?.locale)
  } catch (error) {
    logger.warn('Could not read user locale from Clerk; using default', {
      userId: clerkUserId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return routing.defaultLocale
  }
}
