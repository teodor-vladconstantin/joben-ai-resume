"use client"

import type { MouseEventHandler, ReactNode } from 'react'
import { useLocale } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { APP_ORIGIN, isAppPath } from '@/lib/app-origin'

type AppLinkProps = {
  /** Locale-less path, e.g. `/sign-up?from=ats`. */
  href: string
  className?: string
  children: ReactNode
  onClick?: MouseEventHandler<HTMLAnchorElement>
  'aria-disabled'?: boolean
}

// Link to an app page. From the marketing site it is an absolute app.joben.eu
// URL; inside the app it stays a client-side navigation. Marketing paths and
// single-host setups (no APP_ORIGIN) fall through to the plain i18n Link.
export function AppLink({ href, onClick, ...rest }: AppLinkProps) {
  const locale = useLocale()
  const router = useRouter()

  if (!APP_ORIGIN || !isAppPath(href)) {
    return <Link href={href} onClick={onClick} {...rest} />
  }

  return (
    <a
      href={`${APP_ORIGIN}/${locale}${href}`}
      onClick={(e) => {
        onClick?.(e)
        const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0
        if (e.defaultPrevented || modified || window.location.origin !== APP_ORIGIN) return
        e.preventDefault()
        router.push(href)
      }}
      {...rest}
    />
  )
}
