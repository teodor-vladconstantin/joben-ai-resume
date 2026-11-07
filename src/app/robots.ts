import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { APP_ORIGIN } from '@/lib/app-origin';
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
// Search and user-triggered AI fetchers decide whether Joben is cited in answers.
const allowedBots = [
  'Googlebot',
  'Google-Extended',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot-Extended',
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  // The app host has no public content (marketing paths redirect to the main site).
  if (APP_ORIGIN && (await headers()).get('host') === new URL(APP_ORIGIN).host) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: [...allowedBots, '*'].map((userAgent) => ({ userAgent, allow: '/', disallow })),
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
