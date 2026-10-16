import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/content';

// Private/app routes, the markdown rewrite target and the auth forms.
const disallow = [
  '/*/dashboard/',
  '/*/resumes/',
  '/*/cover-letters/',
  '/*/ai-review/',
  '/*/settings/',
  '/*/feedback/',
  '/*/sign-in',
  '/*/sign-up',
  '/api/',
  '/md/',
];

// A crawler matching a named group ignores the "*" group, so every named bot
// repeats the same disallow list. Public pages stay explicitly allowed.
const allowedBots = ['Googlebot', 'Google-Extended', 'GPTBot', 'ClaudeBot', 'PerplexityBot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [...allowedBots, '*'].map((userAgent) => ({ userAgent, allow: '/', disallow })),
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
