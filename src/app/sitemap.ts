import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/content';
import { resumeRoles } from '@/data/resume-roles';
import { SEO_JOBS } from '@/data/seo-jobs';
import { GUIDES } from '@/data/guides';
import { routing, type AppLocale } from '@/i18n/routing';

const baseUrl = siteConfig.url;

// Fixed per-content dates: bump the matching entry when that page's content
// changes, so crawlers see a lastModified that means something.
const ROLE_PAGES_UPDATED = '2026-09-19';
// Roles that absorbed the former /cv pages (tools, checklist, scan widget).
const MERGED_ROLE_PAGES_UPDATED = '2026-10-14';
const COVER_LETTER_PAGES_UPDATED = '2026-10-14';

type Frequency = MetadataRoute.Sitemap[number]['changeFrequency'];

function alternates(pathByLocale: Partial<Record<AppLocale, string>>) {
  return {
    languages: {
      ...Object.fromEntries(
        routing.locales
          .filter((l) => pathByLocale[l] !== undefined)
          .map((l) => [l, `${baseUrl}/${l}${pathByLocale[l]}`])
      ),
      'x-default': `${baseUrl}/ro${pathByLocale.ro}`,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: {
    path: Partial<Record<AppLocale, string>>;
    lastModified: string;
    changeFrequency: Frequency;
    priority: number;
  }[] = [
    { path: { ro: '', en: '' }, lastModified: '2026-10-07', changeFrequency: 'weekly', priority: 1.0 },
    { path: { ro: '/pricing', en: '/pricing' }, lastModified: '2026-10-14', changeFrequency: 'monthly', priority: 0.9 },
    { path: { ro: '/about', en: '/about' }, lastModified: '2026-09-20', changeFrequency: 'yearly', priority: 0.5 },
    { path: { ro: '/contact', en: '/contact' }, lastModified: '2026-10-07', changeFrequency: 'yearly', priority: 0.5 },
    { path: { ro: '/privacy', en: '/privacy' }, lastModified: '2026-10-14', changeFrequency: 'yearly', priority: 0.3 },
    { path: { ro: '/terms', en: '/terms' }, lastModified: '2026-10-14', changeFrequency: 'yearly', priority: 0.3 },
    { path: { ro: '/cookies', en: '/cookies' }, lastModified: '2026-10-14', changeFrequency: 'yearly', priority: 0.3 },
    { path: { ro: '/resume-examples', en: '/resume-examples' }, lastModified: MERGED_ROLE_PAGES_UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { path: { ro: '/free-ats-checker', en: '/free-ats-checker' }, lastModified: '2026-10-14', changeFrequency: 'monthly', priority: 0.9 },
  ];

  resumeRoles.forEach((role) => {
    const merged = SEO_JOBS.some((job) => job.resumeRoleSlug.en === role.slug.en);
    pages.push({
      path: { ro: `/resume-examples/${role.slug.ro}`, en: `/resume-examples/${role.slug.en}` },
      lastModified: merged ? MERGED_ROLE_PAGES_UPDATED : ROLE_PAGES_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  SEO_JOBS.forEach((job) => {
    pages.push({
      path: { ro: `/scrisoare-intentie/${job.slug.ro}`, en: `/scrisoare-intentie/${job.slug.en}` },
      lastModified: COVER_LETTER_PAGES_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  });

  // Romanian-only: no en path, so no en entry and no hreflang pair.
  GUIDES.forEach((guide) => {
    pages.push({
      path: { ro: `/ghiduri/${guide.slug}` },
      lastModified: guide.dateModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  return pages.flatMap((page) =>
    routing.locales
      .filter((locale) => page.path[locale] !== undefined)
      .map((locale) => ({
        url: `${baseUrl}/${locale}${page.path[locale]}`,
        lastModified: page.lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: alternates(page.path),
      }))
  );
}
