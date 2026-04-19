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
        <h3 className="text-xl font-bold text-white">Recent Documents</h3>
        <Link href="/resumes" className="text-[#0A9548] hover:text-[#16DB65] text-sm font-medium flex items-center gap-1">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {recentDocs.length > 0 ? recentDocs.map((doc) => (
          <Link href={getDocumentHref(doc)} key={doc.id} className="bg-[#0A0F0D] p-5 rounded-2xl border border-white/10 hover:border-[#16DB65]/60 transition-colors group cursor-pointer relative block" suppressHydrationWarning>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-[#0A9548]/10 rounded-lg flex items-center justify-center text-[#0A9548]">
                <FileText className="w-5 h-5" />
              </div>
              {typeof doc.score === 'number' && doc.score > 0 ? <span className="bg-[#0A9548]/10 text-[#0A9548] text-xs font-bold px-2 py-1 rounded">Score: {doc.score}</span> : null}
            </div>
            <h4 className="text-white font-medium mb-1">{doc.title || 'Untitled Document'}</h4>
            <p className="text-xs text-[#FFFFFF]/60">
              {getDocumentTypeLabel(doc)}  -  Updated {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : 'N/A'}
            </p>
          </Link>
        )) : null}

        {/* Empty state / Create new prompt */}
        <div className="bg-[#0A0F0D] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center" suppressHydrationWarning>
            <p className="text-[#FFFFFF]/82 text-sm mb-3">{recentDocs.length === 0 ? 'No resumes yet' : 'Create another tailored resume'}</p>
            <Link href="/resumes" className="bg-[#0A0F0D] hover:bg-white/5 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">Create New</Link>
        </div>
      </div>
    </div>
  )
}


