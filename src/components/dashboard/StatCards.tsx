"use client"
import { FileText, Mail, FileSearch, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

const iconVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.15
  }
}

export function StatCards({ stats }: { stats: { resumes: number, coverLetters: number, aiReviews: number, averageScore: number } }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" suppressHydrationWarning>
      {[
        { label: 'Resumes', count: stats.resumes.toString(), icon: FileText, href: '/resumes' },
        { label: 'Cover Letters', count: stats.coverLetters.toString(), icon: Mail, href: '/cover-letters' },
        { label: 'Reviews', count: stats.aiReviews.toString(), icon: FileSearch, href: '/ai-review' },
        { label: 'Avg Score', count: `${stats.averageScore}/100`, icon: TrendingUp, href: '/ai-review' }
      ].map((stat, i) => (
        <motion.div
          key={i}
          initial="initial"
          animate="animate"
          variants={cardVariants}
          transition={{ delay: i * 0.05 }}
        >
          <Link
            href={stat.href}
            className="block bg-(--surface) p-6 rounded-2xl border border-(--border) hover:border-(--accent)/60 transition-colors group flex items-center justify-between"
          >
            <div>
              <p className="text-(--muted) text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-(--foreground)">{stat.count}</p>
            </div>
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-(--accent-muted)"
              variants={iconVariants}
              whileHover="hover"
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <stat.icon className="w-6 h-6 text-(--accent)" />
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
