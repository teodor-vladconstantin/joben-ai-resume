"use client"

import Image from 'next/image'
import { Link, usePathname } from '@/i18n/navigation'
import { UserButton } from '@clerk/nextjs'
import { FileText, FileSearch, LayoutDashboard, Mail, Menu, Plus, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { buttonVariants } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/cn'

// Signed-in top bar: brand, nav links with an active pill, then locale, theme,
// primary action and account menu. Mobile folds the links into a dropdown.
export function AppNav() {
  const pathname = usePathname()
  const tNav = useTranslations('Nav')
  const tDashboard = useTranslations('Dashboard')

  const items = [
    { href: '/dashboard', label: tNav('dashboard'), icon: LayoutDashboard },
    { href: '/resumes', label: tNav('resumes'), icon: FileText },
    { href: '/cover-letters', label: tNav('coverLetters'), icon: Mail },
    { href: '/ai-review', label: tNav('aiReview'), icon: FileSearch },
    { href: '/settings', label: tDashboard('sidebarSettings'), icon: Settings },
  ]
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-(--container-max) items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="relative h-8 w-8 overflow-hidden rounded-md">
            <Image src="/jobeneu_logo.jpg" alt="Joben logo" fill sizes="32px" className="object-cover" priority />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">Joben</span>
        </Link>

        <nav data-tour="dashboard-sidebar" className="hidden items-center gap-1 md:flex">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href="/resumes/new"
            data-tour="dashboard-create"
            className={cn('hidden sm:inline-flex', buttonVariants('primary', 'sm'))}
          >
            <Plus className="size-4" /> {tNav('createNew')}
          </Link>
          <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9 border border-border' } }} />

          <DropdownMenu>
            <DropdownMenuTrigger
              className="grid size-9 place-items-center rounded-md text-foreground hover:bg-accent md:hidden"
              aria-label={tNav('menu')}
            >
              <Menu className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {items.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} className={cn(isActive(href) && 'bg-accent')}>
                    <Icon className="size-4" /> {label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <Link href="/resumes/new" className="font-medium">
                  <Plus className="size-4" /> {tNav('createNew')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
