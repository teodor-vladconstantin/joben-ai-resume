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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [...allowedBots, '*'].map((userAgent) => ({ userAgent, allow: '/', disallow })),
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
