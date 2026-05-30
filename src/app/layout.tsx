import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { clerkAppearance } from '@/lib/clerk-appearance'
import { Analytics } from '@vercel/analytics/next'
import { validateEnv } from '@/lib/env'
import { PostHogProvider } from '@/components/PostHogProvider'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

validateEnv()

export const metadata: Metadata = {
  metadataBase: new URL('https://joben.eu'),
  title: 'Joben | Best Free AI Resume Builder for ATS Optimization',
  description: 'Joben is a free AI resume builder that helps you create ATS-optimized resumes and cover letters in minutes. Pass resume screeners and get more interviews with our proven templates.',
  keywords: ['AI resume builder', 'free resume maker', 'ATS resume format', 'CV builder', 'joben', 'resume templates', 'best AI resume builder'],
  authors: [{ name: 'Joben' }],
  creator: 'Joben',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/jobeneu_logo.jpg',
    shortcut: '/jobeneu_logo.jpg',
    apple: '/jobeneu_logo.jpg',
  },
  openGraph: {
    title: 'Joben | Best Free AI Resume Builder for ATS Optimization',
    description: 'Joben is a free AI resume builder that helps you create ATS-optimized resumes and cover letters in minutes. Pass resume screeners and get more interviews with our proven templates.',
    url: '/',
    siteName: 'Joben',
    images: [
      {
        url: '/jobeneu_logo.jpg', // Fallback, recommend adding a proper 1200x630 og-image.jpg
        width: 800,
        height: 600,
        alt: 'Joben AI Resume Builder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joben | Best Free AI Resume Builder for ATS Optimization',
    description: 'Joben is a free AI resume builder that helps you create ATS-optimized resumes and cover letters in minutes. Pass resume screeners and get more interviews with our proven templates.',
    creator: '@joben_ai',
    images: ['/jobeneu_logo.jpg'], // Fallback
  },
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`${geist.variable} ${geistMono.variable} font-sans bg-bg-base text-text-primary min-h-screen flex flex-col antialiased`} suppressHydrationWarning>
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
                    '@id': 'https://joben.eu/#website',
                    url: 'https://joben.eu/',
                    name: 'Joben',
                    description: 'Best Free AI Resume Builder for ATS Optimization',
                    publisher: {
                      '@type': 'Organization',
                      name: 'Joben',
                      logo: {
                        '@type': 'ImageObject',
                        url: 'https://joben.eu/jobeneu_logo.jpg'
                      }
                    }
                  }
                ]
              })
            }}
          />
          <PostHogProvider>
            {children}
          </PostHogProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
