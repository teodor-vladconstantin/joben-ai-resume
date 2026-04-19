"use client"
import { FileText, Mail, FileSearch, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export function StatCards({ stats }: { stats: { resumes: number, coverLetters: number, aiReviews: number, averageScore: number } }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" suppressHydrationWarning>
      {[
        { label: 'Resumes', count: stats.resumes.toString(), icon: FileText, href: '/resumes', color: 'text-[#0A9548]', bg: 'bg-[#0A9548]/10' },
        { label: 'Cover Letters', count: stats.coverLetters.toString(), icon: Mail, href: '/cover-letters', color: 'text-[#0A9548]', bg: 'bg-[#0A0F0D]' },
        { label: 'Reviews', count: stats.aiReviews.toString(), icon: FileSearch, href: '/ai-review', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Avg Score', count: `${stats.averageScore}/100`, icon: TrendingUp, href: '/ai-review', color: 'text-[#0A9548]', bg: 'bg-[#0A9548]/10' }
      ].map((stat, i) => (
        <Link key={i} href={stat.href} className="bg-[#0A0F0D] p-6 rounded-2xl border border-white/10 hover:border-[#16DB65]/60 transition-colors group flex items-center justify-between" suppressHydrationWarning>
          <div>
            <p className="text-[#FFFFFF]/82 text-sm font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.count}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} group-hover:scale-110 transition-transform`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
        </Link>
      ))}
    </div>
  )
}


