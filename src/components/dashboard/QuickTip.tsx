"use client"
import { Lightbulb, RefreshCw, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

const tips = [
  "Use strong action verbs to start your bullet points. E.g., 'Spearheaded' instead of 'Responsible for'.",
  "Quantify your achievements with numbers, percentages, or dollar amounts to provide clear impact.",
  "Keep your resume to one page unless you have more than 10 years of highly relevant experience."
]

export function QuickTip() {
  const [idx, setIdx] = useState(0)

  return (
    <div className="bg-[#0A0F0D] p-6 rounded-2xl border border-white/10 flex flex-col justify-between" suppressHydrationWarning>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Lightbulb className="text-[#16DB65] w-5 h-5" /> Quick Tip
          </h3>
          <button onClick={() => setIdx((idx + 1) % tips.length)} className="text-[#FFFFFF]/82 hover:text-white p-1">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[#FFFFFF]/72 text-sm leading-relaxed mb-6">{tips[idx]}</p>
      </div>
      <Link href="/resumes" className="text-[#0A9548] hover:text-[#16DB65] text-sm font-medium flex items-center gap-1">
        Edit resume <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}



