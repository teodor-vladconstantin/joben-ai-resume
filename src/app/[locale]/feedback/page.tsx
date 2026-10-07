import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { FeedbackForm } from './FeedbackForm'
import type { AppLocale } from '@/i18n/routing'

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Feedback' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    robots: { index: false, follow: false },
  }
}

export default async function FeedbackPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Feedback' })
  // Protected route: middleware already enforces auth, but guard here too so
  // the redirect returns the user straight back to /feedback after sign-in.
  const { userId: rawUserId } = await auth()
  if (!rawUserId) {
    redirect({ href: { pathname: '/sign-in', query: { redirect_url: `/${locale}/feedback` } }, locale })
  }
  // next-intl's redirect() return type doesn't collapse to a bare `never`
  // TypeScript can narrow on, unlike next/navigation's — assert explicitly.
  const userId = rawUserId as string

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress ?? ''

  // If the user already submitted, render a thank-you instead of the form.
  // A missing table (migration not applied yet) leaves `existing` null and
  // falls through to the form, which surfaces a friendly error on submit.
  const supabase = createServerClient()
  const { data: existing } = await supabase
    .from('feedback')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-(--background) px-4 py-16 text-(--foreground)">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-8 text-center">
          <p className="font-mono text-(length:--text-label) text-(--muted)">{t('eyebrow')}</p>
          <h1 className="mt-2 text-2xl font-semibold text-(--foreground)">{t('heading')}</h1>
          <p className="mt-2 text-sm text-(--muted)">{t('intro')}</p>
        </header>

        <Card className="p-6 sm:p-8">
          {existing ? (
            <div className="border border-(--border) bg-(--accent-muted) px-6 py-8 text-center">
              <p className="text-base font-medium text-(--foreground)">{t('already')}</p>
            </div>
          ) : (
            <FeedbackForm email={email} />
          )}
        </Card>
      </div>
    </main>
  )
}
