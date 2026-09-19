"use client"
import { Link } from '@/i18n/navigation'
import { FileText, ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { RecentDocument } from '@/lib/actions/db'
import { buttonVariants } from '@/components/ui/Button'

export function RecentDocuments({ recentDocs }: { recentDocs: RecentDocument[] }) {
  const t = useTranslations('Dashboard.recentDocuments')
  const locale = useLocale()

  function getDocumentHref(doc: RecentDocument) {
    return doc.type === 'cover_letter' ? `/cover-letters/${doc.id}` : `/resumes/${doc.id}`
  }

  function getDocumentTypeLabel(doc: RecentDocument) {
    return doc.type === 'cover_letter' ? t('coverLetterLabel') : t('resumeLabel')
  }

  return (
    <div className="mt-8" suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-(--foreground)">{t('heading')}</h3>
        <Link href="/resumes" className="inline-flex items-center gap-1 text-(--foreground) text-sm font-medium border-b border-transparent hover:border-(--accent) transition-colors duration-150 ease-out">
          {t('viewAll')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 border border-(--border) divide-y divide-(--border) md:grid-cols-3 md:divide-y-0 md:divide-x">

        {recentDocs.length > 0 ? recentDocs.map((doc) => (
          <Link href={getDocumentHref(doc)} key={doc.id} className="p-5 transition-colors duration-150 ease-out hover:bg-(--background) group cursor-pointer relative block" suppressHydrationWarning>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-(--accent-muted) flex items-center justify-center text-(--foreground)">
                <FileText className="w-5 h-5" />
              </div>
              {typeof doc.score === 'number' && doc.score > 0 ? <span className="font-mono text-xs font-bold text-(--muted) tabular-nums">{t('scorePrefix')}{doc.score}</span> : null}
            </div>
            <h4 className="text-(--foreground) font-medium mb-1">{doc.title || t('untitledDocument')}</h4>
            <p className="text-xs text-(--muted)">
              {getDocumentTypeLabel(doc)}  -  {t('updatedPrefix')}{doc.updated_at ? new Date(doc.updated_at).toLocaleDateString(locale) : t('noDateValue')}
            </p>
          </Link>
        )) : null}

        {/* Empty state / Create new prompt */}
        <div className="border border-dashed border-(--border) flex flex-col items-center justify-center p-6 text-center" suppressHydrationWarning>
            <p className="text-(--muted) text-sm mb-3">{recentDocs.length === 0 ? t('noResumesYet') : t('createAnother')}</p>
            <Link href="/resumes" className={buttonVariants('secondary', 'sm')}>{t('createNew')}</Link>
        </div>
      </div>
    </div>
  )
}
