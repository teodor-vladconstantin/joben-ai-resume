"use client"

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, UserButton } from '@clerk/nextjs'
import { LayoutDashboard, FileText, Mail, FileSearch, Settings, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resumes', label: 'Resumes', icon: FileText },
  { href: '/cover-letters', label: 'Cover Letters', icon: Mail },
  { href: '/ai-review', label: 'AI Review', icon: FileSearch },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isLoaded, isSignedIn } = useAuth()

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-(--border) bg-(--surface) min-h-screen sticky top-0">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image src="/jobeneu_logo.jpg" alt="Joben logo" fill sizes="32px" className="object-cover" />
          </span>
          <span className="text-lg font-bold tracking-tight text-(--foreground)">Joben</span>
        </Link>
        {isLoaded && isSignedIn ? (
          <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8 border border-(--border)' } }} />
        ) : (
          <div className="h-8 w-8 rounded-full bg-(--surface-elevated)" />
        )}
      </div>

      <div className="px-5 mb-4">
        <Link href="/resumes/new" className={`w-full justify-center ${buttonVariants('primary', 'sm')}`}>
          <Plus className="w-4 h-4" /> Create New
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-(--accent-muted) text-(--accent)' : 'text-(--muted) hover:bg-(--surface-elevated) hover:text-(--foreground)'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
