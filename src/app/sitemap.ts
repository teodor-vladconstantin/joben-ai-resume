import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/content';
import { resumeRoles } from '@/data/resume-roles';
import { routing, type AppLocale } from '@/i18n/routing';

const baseUrl = siteConfig.url;

function alternates(pathByLocale: Record<AppLocale, string>) {
  return {
    languages: Object.fromEntries(
      routing.locales.map((l) => [l, `${baseUrl}${pathByLocale[l]}`])
    ),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths: Record<AppLocale, string>[] = [
    { ro: '', en: '' },
    { ro: '/pricing', en: '/pricing' },
    { ro: '/privacy', en: '/privacy' },
    { ro: '/terms', en: '/terms' },
    { ro: '/sign-in', en: '/sign-in' },
    { ro: '/sign-up', en: '/sign-up' },
    { ro: '/resume-examples', en: '/resume-examples' },
    { ro: '/free-ats-checker', en: '/free-ats-checker' },
    { ro: '/cookies', en: '/cookies' },
  ];
  const priorities = [1.0, 0.9, 0.3, 0.3, 0.5, 0.8, 0.7, 0.8, 0.3];
  const frequencies: MetadataRoute.Sitemap[number]['changeFrequency'][] = [
    'weekly', 'weekly', 'yearly', 'yearly', 'monthly', 'monthly', 'monthly', 'monthly', 'yearly',
  ];

  const entries: MetadataRoute.Sitemap = []

  staticPaths.forEach((pathByLocale, i) => {
    routing.locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${pathByLocale[locale]}`,
        lastModified: new Date(),
        changeFrequency: frequencies[i],
        priority: priorities[i],
        alternates: alternates(pathByLocale),
      })
    })
  })

  resumeRoles.forEach((role) => {
    const pathByLocale = {
      ro: `/resume-examples/${role.slug.ro}`,
      en: `/resume-examples/${role.slug.en}`,
    } as Record<AppLocale, string>
    routing.locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${pathByLocale[locale]}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: alternates(pathByLocale),
      })
    })
  })

  return entries
}
