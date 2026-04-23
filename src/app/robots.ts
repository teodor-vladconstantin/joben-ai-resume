import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/content';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/resumes/',
        '/api/',
        '/cover-letters/',
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
