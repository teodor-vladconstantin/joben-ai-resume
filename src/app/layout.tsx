import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Joben | ATS-Optimized AI Resume Builder',
  description: 'The Only Free AI Resume Builder You\'ll Ever Need.',
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
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`${inter.className} bg-(--background) text-(--foreground) min-h-screen flex flex-col`} suppressHydrationWarning>
          <Script
            id="strip-browser-injected-bis-attr"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: stripInjectedAttrScript }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
