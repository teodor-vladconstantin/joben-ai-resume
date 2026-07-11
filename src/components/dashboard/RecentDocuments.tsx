"use client"
import Link from 'next/link'
import { FileText, ArrowRight } from 'lucide-react'
import type { RecentDocument } from '@/lib/actions/db'

function getDocumentHref(doc: RecentDocument) {
  return doc.type === 'cover_letter' ? `/cover-letters/${doc.id}` : `/resumes/${doc.id}`
}

function getDocumentTypeLabel(doc: RecentDocument) {
  return doc.type === 'cover_letter' ? 'Cover Letter' : 'Resume'
}

export function RecentDocuments({ recentDocs }: { recentDocs: RecentDocument[] }) {
  return (
    <div className="mt-8" suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-(--foreground)">Recent Documents</h3>
        <Link href="/resumes" className="text-(--accent) hover:text-(--accent-strong) text-sm font-medium flex items-center gap-1">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {recentDocs.length > 0 ? recentDocs.map((doc) => (
          <Link href={getDocumentHref(doc)} key={doc.id} className="bg-(--surface) p-5 rounded-2xl border border-(--border) hover:border-(--accent)/60 transition-colors group cursor-pointer relative block" suppressHydrationWarning>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-(--accent-muted) rounded-lg flex items-center justify-center text-(--accent)">
                <FileText className="w-5 h-5" />
              </div>
              {typeof doc.score === 'number' && doc.score > 0 ? <span className="bg-(--accent-muted) text-(--accent) text-xs font-bold px-2 py-1 rounded">Score: {doc.score}</span> : null}
            </div>
            <h4 className="text-(--foreground) font-medium mb-1">{doc.title || 'Untitled Document'}</h4>
            <p className="text-xs text-(--muted)">
              {getDocumentTypeLabel(doc)}  -  Updated {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('en-US') : 'N/A'}
            </p>
          </Link>
        )) : null}

        {/* Empty state / Create new prompt */}
        <div className="bg-(--surface) border-2 border-dashed border-(--border) rounded-2xl flex flex-col items-center justify-center p-6 text-center" suppressHydrationWarning>
            <p className="text-(--muted) text-sm mb-3">{recentDocs.length === 0 ? 'No resumes yet' : 'Create another tailored resume'}</p>
            <Link href="/resumes" className="bg-(--surface) hover:bg-(--surface-elevated) text-(--foreground) px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-(--border)">Create New</Link>
        </div>
      </div>
    </div>
  )
}
