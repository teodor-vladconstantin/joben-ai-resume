"use client"
import { Link } from '@/i18n/navigation'
import { FileText, ArrowRight, Plus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { RecentDocument } from '@/lib/actions/db'
import { buttonVariants } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table'

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
    <section className="mt-8 rounded-lg border border-border bg-card shadow-card" suppressHydrationWarning>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold text-foreground">{t('heading')}</h3>
        <Link href="/resumes" className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline">
          {t('viewAll')} <ArrowRight className="size-4" />
        </Link>
      </div>

      {recentDocs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('noResumesYet')}
          action={
            <Link href="/resumes/new" className={buttonVariants('primary', 'sm')}>
              <Plus className="size-4" /> {t('createNew')}
            </Link>
          }
        />
      ) : (
        <>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>{t('nameColumn')}</TableHeaderCell>
                <TableHeaderCell className="hidden sm:table-cell">{t('typeColumn')}</TableHeaderCell>
                <TableHeaderCell className="hidden md:table-cell">{t('updatedColumn')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('scoreColumn')}</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {recentDocs.map((doc) => (
                <TableRow key={doc.id} suppressHydrationWarning>
                  <TableCell>
                    <Link href={getDocumentHref(doc)} className="flex items-center gap-3 font-medium text-foreground">
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                        <FileText className="size-4" />
                      </span>
                      <span className="truncate">{doc.title || t('untitledDocument')}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{getDocumentTypeLabel(doc)}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString(locale) : t('noDateValue')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">
                    {typeof doc.score === 'number' && doc.score > 0 ? doc.score : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t border-border px-5 py-3">
            <Link href="/resumes/new" className={buttonVariants('secondary', 'sm')}>
              <Plus className="size-4" /> {t('createAnother')}
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
