'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import {
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
  Sparkles,
  CreditCard,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useState } from 'react'
import { Eyebrow } from '@/components/ui/Eyebrow'

const navGroups = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Resumes', href: '/resumes/new', icon: FileText },
      { label: 'AI Review', href: '/ai-review', icon: Sparkles },
      { label: 'Cover Letters', href: '/cover-letters/new', icon: Mail },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Pricing', href: '/pricing', icon: CreditCard },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSignedIn, user } = useUser()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'h-screen border-r border-border-faint flex flex-col shrink-0 bg-bg-base transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="h-11 flex items-center border-b border-border-faint px-3">
        <Link href="/" className="flex items-center gap-2 text-text-primary hover:text-accent transition-colors">
          <FileText size={16} className="shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-heading truncate">Joben</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <Eyebrow className="px-2.5 py-1">{group.label}</Eyebrow>
            )}
            {group.items.map(item => {
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-body transition-colors',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-bg-hover text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={14} className="shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {!collapsed && isActive && (
                    <ChevronRight size={12} className="ml-auto shrink-0 text-text-muted" />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: collapse + user */}
      <div className="p-2 border-t border-border-faint space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-body text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors w-full',
            collapsed ? 'justify-center' : ''
          )}
        >
          <ChevronRight
            size={14}
            className={cn('shrink-0 transition-transform', collapsed ? '' : 'rotate-180')}
          />
          {!collapsed && <span className="truncate">Collapse</span>}
        </button>
        {isSignedIn && (
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-2 px-2')}>
            <UserButton />
            {!collapsed && (
              <span className="text-xs text-text-muted truncate">
                {user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || ''}
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export function DashboardShell({
  children,
  title,
  actions,
}: {
  children: React.ReactNode
  title?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="h-11 border-b border-border-faint flex items-center px-6 justify-between">
          {title && (
            <h1 className="text-heading font-medium text-text-primary">{title}</h1>
          )}
          <div className="flex items-center gap-2">{actions}</div>
        </div>
        {/* Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
