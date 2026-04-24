"use client"
import { FileText, Mail, FileSearch, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
}

const iconVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.15,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
}

export function StatCards({ stats }: { stats: { resumes: number, coverLetters: number, aiReviews: number, averageScore: number } }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" suppressHydrationWarning>
      {[
        { label: 'Resumes', count: stats.resumes.toString(), icon: FileText, href: '/resumes', color: 'text-[#0A9548]', bg: 'bg-[#0A9548]/10' },
        { label: 'Cover Letters', count: stats.coverLetters.toString(), icon: Mail, href: '/cover-letters', color: 'text-[#0A9548]', bg: 'bg-[#0A0F0D]' },
        { label: 'Reviews', count: stats.aiReviews.toString(), icon: FileSearch, href: '/ai-review', color: 'text-[#16DB65]', bg: 'bg-[#0A9548]/12' },
        { label: 'Avg Score', count: `${stats.averageScore}/100`, icon: TrendingUp, href: '/ai-review', color: 'text-[#0A9548]', bg: 'bg-[#0A9548]/10' }
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
            className="block bg-[#0A0F0D] p-6 rounded-2xl border border-white/10 hover:border-[#16DB65]/60 transition-colors group flex items-center justify-between"
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div>
              <p className="text-[#FFFFFF]/82 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.count}</p>
            </div>
            <motion.div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}
              variants={iconVariants}
              whileHover="hover"
            >
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}



