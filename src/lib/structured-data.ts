import { siteConfig } from '@/lib/content'

// Standalone Organization entity for the @graph, referenced by @id from
// WebSite.publisher and any other node that needs it, instead of duplicating
// (or nesting) the Organization inline — the schema.org-recommended pattern
// for a single entity referenced from multiple places in the same graph.
// sameAs only lists real, confirmed profiles (2026-09-19) — no invented or
// unconfirmed URLs.
export function organizationJsonLd() {
  return {
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url}/jobeneu_logo.jpg`,
    },
    sameAs: [
      'https://www.linkedin.com/company/jobeneu/',
      'https://www.instagram.com/joben.eu',
      'https://www.facebook.com/people/Jobeneu/100066505480256/',
      'https://www.producthunt.com/products/joben',
    ],
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  }
}
