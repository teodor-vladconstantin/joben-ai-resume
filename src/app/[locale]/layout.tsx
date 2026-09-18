import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { JetBrains_Mono } from 'next/font/google'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { clerkAppearance } from '@/lib/clerk-appearance'
import { validateEnv } from '@/lib/env'
import { siteConfig } from '@/lib/content'
import { ClientProviders } from '@/components/ClientProviders'
import { ConditionalFooter } from '@/components/layout/ConditionalFooter'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import { CONSENT_MODE_DEFAULT_SCRIPT } from '@/lib/consent-mode'

validateEnv()

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata.home' })
  const title = t('title')
  const description = t('description')

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    keywords: ['AI resume builder', 'free resume maker', 'ATS resume format', 'CV builder', 'joben', 'resume templates', 'best AI resume builder'],
    authors: [{ name: 'Joben' }],
    creator: 'Joben',
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
    icons: {
      icon: '/jobeneu_logo.jpg',
      shortcut: '/jobeneu_logo.jpg',
      apple: '/jobeneu_logo.jpg',
    },
    openGraph: {
      title,
      description,
      url: `/${locale}`,
      siteName: 'Joben',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Joben AI Resume Builder',
        },
      ],
      locale: locale === 'ro' ? 'ro_RO' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@joben_ai',
      images: ['/og-image.png'],
    },
  }
}

const stripInjectedAttrScript = `(function () {
  var ATTR = 'bis_skin_checked';

  function stripAttr(node) {
    if (!node || node.nodeType !== 1) return;

    if (node.hasAttribute && node.hasAttribute(ATTR)) {
      node.removeAttribute(ATTR);
    }

    if (!node.querySelectorAll) return;

    var matches = node.querySelectorAll('[' + ATTR + ']');
    for (var i = 0; i < matches.length; i++) {
      matches[i].removeAttribute(ATTR);
    }
  }

  stripAttr(document.documentElement);

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];

      if (mutation.type === 'attributes' && mutation.attributeName === ATTR) {
        if (mutation.target && mutation.target.removeAttribute) {
          mutation.target.removeAttribute(ATTR);
        }
      }

      for (var j = 0; j < mutation.addedNodes.length; j++) {
        stripAttr(mutation.addedNodes[j]);
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [ATTR],
  });

  window.addEventListener('load', function () {
    setTimeout(function () {
      observer.disconnect();
    }, 5000);
  });
})();`

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'Metadata.home' })
  const websiteDescription = t('description')

  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang={locale} className="dark" suppressHydrationWarning>
        <body className={`${jetbrainsMono.variable} bg-(--background) text-(--foreground) min-h-screen flex flex-col font-sans`} suppressHydrationWarning>
          <Script
            id="consent-mode-default"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: CONSENT_MODE_DEFAULT_SCRIPT }}
          />
          {process.env.NEXT_PUBLIC_GTM_ID && (
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          )}
          <Script
            id="strip-browser-injected-bis-attr"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: stripInjectedAttrScript }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                  {
                    '@type': 'WebSite',
                    '@id': `${siteConfig.url}/#website`,
                    url: `${siteConfig.url}/${locale}`,
                    name: 'Joben',
                    description: websiteDescription,
                    inLanguage: locale,
                    publisher: {
                      '@type': 'Organization',
                      name: 'Joben',
                      logo: {
                        '@type': 'ImageObject',
                        url: `${siteConfig.url}/jobeneu_logo.jpg`
                      }
                    }
                  }
                ]
              })
            }}
          />
          <NextIntlClientProvider locale={locale}>
            <ClientProviders>
              {children}
            </ClientProviders>
            <ConditionalFooter footer={<SiteFooter />} />
            <CookieConsentBanner />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
