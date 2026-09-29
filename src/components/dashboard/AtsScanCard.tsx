import { AlertTriangle, ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Eyebrow } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import type { ClaimedAtsScan } from '@/lib/actions/db'
import type { AppLocale } from '@/i18n/routing'

// The free-ATS-checker result, carried into the account (claimed in the Clerk
// webhook), so a new user picks up where the anonymous scan left off.
export async function AtsScanCard({ scan, locale }: { scan: ClaimedAtsScan; locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: 'Dashboard.atsScanCard' })
  const hasIssues = scan.issues.length > 0

  return (
    <section className="bg-(--surface-elevated) p-6 border border-(--border) mb-8">
      <Eyebrow className="mb-3">{t('eyebrow')}</Eyebrow>
      <h2 className="text-xl font-bold text-(--foreground)">
        {hasIssues
          ? t('headlineWithIssues', { score: scan.score, count: scan.issues.length })
          : t('headlineNoIssues', { score: scan.score })}
      </h2>

      {hasIssues && (
        <ul className="mt-4 space-y-3">
          {scan.issues.map((item, index) => (
            <li key={index} className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-(--foreground) mt-0.5" />
              <div>
                <p className="text-(--foreground) font-semibold text-sm">{item.issue}</p>
                <p className="text-(--muted) text-sm mt-0.5">{item.explanation}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-(--muted) text-sm mt-4">{hasIssues ? t('hint') : t('hintNoIssues')}</p>
      <Link href="/resumes/new" className={`mt-4 inline-flex items-center gap-2 ${buttonVariants('primary', 'md')}`}>
        {t('cta')} <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  )
}
