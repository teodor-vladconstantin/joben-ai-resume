import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/Button'

export default async function NotFound() {
  const t = await getTranslations('ErrorPages.notFound')

  return (
    <div className="min-h-screen bg-(--background) flex items-center px-4">
      <div className="max-w-md">
        <p className="font-mono text-sm text-(--muted) mb-3">404</p>
        <h1 className="text-2xl font-bold text-(--foreground) mb-3">{t('title')}</h1>
        <p className="text-(--muted) text-sm mb-8">{t('description')}</p>
        <Link
          href="/dashboard"
          className={buttonVariants('primary', 'md')}
        >
          {t('cta')}
        </Link>
      </div>
    </div>
  )
}
