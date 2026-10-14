import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from '@/i18n/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { AccountUserButton } from '@/components/settings/AccountUserButton'
import { DeleteAccountButton } from '@/components/settings/DeleteAccountButton'
import { ExportDataButton } from '@/components/settings/ExportDataButton'
import { ManageBillingButton } from '@/components/settings/ManageBillingButton'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Mail, CreditCard, Bell, Shield } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { getEmailHintFromSessionClaims, getUserPlan, PLAN_DEFINITIONS } from '@/lib/plans'
import type { AppLocale } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'

// Localized: a fixed English title showed on the Romanian UI.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Dashboard' })
  return {
    title: `${t('sidebarSettings')} | Joben`,
    robots: { index: false, follow: false },
  }
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SettingsPage' })
  const { userId: rawUserId, sessionClaims } = await auth()
  if (!rawUserId) redirect({ href: '/sign-in', locale })
  // next-intl's redirect() return type doesn't collapse to a bare `never`
  // TypeScript can narrow on, unlike next/navigation's — assert explicitly.
  const userId = rawUserId as string

  const emailHint = getEmailHintFromSessionClaims(sessionClaims)
  const plan = await getUserPlan(userId, emailHint)

  const supabase = createServerClient()
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_subscription_id, pro_expires_at')
    .eq('clerk_id', userId)
    .maybeSingle()

  // Pass or referral grant: Pro without a subscription, until pro_expires_at.
  const grantExpiresAt =
    !profile?.stripe_subscription_id && plan === 'pro' && profile?.pro_expires_at
      ? new Date(profile.pro_expires_at)
      : null
  // Only a subscription has something to manage in the portal; pass holders
  // (who also have a Stripe customer) get the upgrade path.
  const hasSubscription = Boolean(profile?.stripe_subscription_id)
  const dateFormatter = new Intl.DateTimeFormat(locale === 'ro' ? 'ro-RO' : 'en-GB', { dateStyle: 'long' })

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
          <h1 className="text-3xl font-bold text-(--foreground) mb-8">{t('title')}</h1>

          <div className="space-y-6">
            {/* Account */}
            <div className="bg-(--surface) p-6 border border-(--border)">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-(--foreground)">{t('account.title')}</h2>
                  <p className="text-sm text-(--muted) mt-1">
                    {t('account.description')}
                  </p>
                </div>
                <AccountUserButton />
              </div>
              <Divider className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-(--muted)">
                    <Mail size={14} />
                    {t('account.emailSettings')}
                  </div>
                  <Badge variant="muted">{t('managedByClerk')}</Badge>
                </div>
                <ExportDataButton label={t('account.exportData')} buttonLabel={t('account.exportDataButton')} />
              </div>
            </div>

            {/* Billing */}
            <div className="bg-(--surface) p-6 border border-(--border)">
              <div>
                <h2 className="text-lg font-bold text-(--foreground)">{t('billing.title')}</h2>
                <p className="text-sm text-(--muted) mt-1">
                  {t('billing.description')}
                </p>
              </div>
              <Divider className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-(--muted)">
                    <CreditCard size={14} />
                    {t('billing.currentPlan')}
                  </div>
                  <Badge variant="solid">{PLAN_DEFINITIONS[plan].label}</Badge>
                </div>
                {grantExpiresAt ? (
                  <p className="text-sm text-(--foreground)">
                    {t('billing.grantActiveUntil', { date: dateFormatter.format(grantExpiresAt) })}
                  </p>
                ) : null}
                {hasSubscription || plan !== 'recruiting' ? (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-(--muted)">
                      {hasSubscription ? t('billing.subscription') : t('billing.plan')}
                    </div>
                    <ManageBillingButton hasSubscription={hasSubscription} />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-(--surface) p-6 border border-(--border)">
              <div>
                <h2 className="text-lg font-bold text-(--foreground)">{t('notifications.title')}</h2>
                <p className="text-sm text-(--muted) mt-1">
                  {t('notifications.description')}
                </p>
              </div>
              <Divider className="my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-(--muted)">
                  <Bell size={14} />
                  {t('notifications.emailNotifications')}
                </div>
                <Badge variant="muted">{t('notifications.enabled')}</Badge>
              </div>
            </div>

            {/* Security */}
            <div className="bg-(--surface) p-6 border border-(--border)">
              <div>
                <h2 className="text-lg font-bold text-(--foreground)">{t('security.title')}</h2>
                <p className="text-sm text-(--muted) mt-1">
                  {t('security.description')}
                </p>
              </div>
              <Divider className="my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-(--muted)">
                  <Shield size={14} />
                  {t('security.twoFactor')}
                </div>
                <Badge variant="muted">{t('managedByClerk')}</Badge>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-(--surface) p-6 border border-(--border) border-l-2 border-l-(--foreground)">
              <div>
                <h2 className="text-lg font-bold text-(--foreground)">{t('dangerZone.title')}</h2>
                <p className="text-sm text-(--muted) mt-1">
                  {t('dangerZone.description')}
                </p>
              </div>
              <Divider className="my-4" />
              <DeleteAccountButton />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
