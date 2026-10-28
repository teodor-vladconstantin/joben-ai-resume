"use client"

import { useSyncExternalStore, type MouseEventHandler, type ReactNode } from 'react'
import { useLocale } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { APP_ORIGIN, SITE_ORIGIN, isAppPath, originHref } from '@/lib/app-origin'

type AppLinkProps = {
  /** Locale-less path, e.g. `/sign-up?from=ats`. */
  href: string
  className?: string
  children: ReactNode
  onClick?: MouseEventHandler<HTMLAnchorElement>
  'aria-disabled'?: boolean
}

const noopSubscribe = () => () => {}
const onAppHostNow = () => Boolean(APP_ORIGIN) && window.location.origin === APP_ORIGIN

// Link that knows about the two hosts. App pages: an absolute app.joben.eu URL
// from the marketing site, a client-side navigation inside the app. Marketing
// pages: a plain absolute joben.eu link when rendered on the app host, because
// a Link there would prefetch through the proxy redirect and the CSP blocks
// that cross-origin hop. Single-host setups (no APP_ORIGIN) use the i18n Link.
export function AppLink({ href, onClick, ...rest }: AppLinkProps) {
  const locale = useLocale()
  const router = useRouter()
  // false on the server and during hydration, so markup matches; flips on the app host.
  const onAppHost = useSyncExternalStore(noopSubscribe, onAppHostNow, () => false)

  if (!APP_ORIGIN) return <Link href={href} onClick={onClick} {...rest} />

  if (!isAppPath(href)) {
    if (onAppHost && SITE_ORIGIN) {
      return <a href={originHref(SITE_ORIGIN, locale, href)} onClick={onClick} {...rest} />
    }
    return <Link href={href} prefetch={false} onClick={onClick} {...rest} />
  }

  return (
    <a
      href={originHref(APP_ORIGIN, locale, href)}
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
