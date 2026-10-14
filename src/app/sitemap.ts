import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/content';
import { resumeRoles } from '@/data/resume-roles';
import { SEO_JOBS } from '@/data/seo-jobs';
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
    { ro: '/about', en: '/about' },
    { ro: '/contact', en: '/contact' },
    { ro: '/privacy', en: '/privacy' },
    { ro: '/terms', en: '/terms' },
    { ro: '/sign-in', en: '/sign-in' },
    { ro: '/sign-up', en: '/sign-up' },
    { ro: '/resume-examples', en: '/resume-examples' },
    { ro: '/free-ats-checker', en: '/free-ats-checker' },
    { ro: '/verificare-cv', en: '/verificare-cv' },
    { ro: '/cookies', en: '/cookies' },
  ];
  const priorities = [1.0, 0.9, 0.5, 0.5, 0.3, 0.3, 0.5, 0.8, 0.7, 0.8, 0.9, 0.3];
  const frequencies: MetadataRoute.Sitemap[number]['changeFrequency'][] = [
    'weekly', 'weekly', 'monthly', 'monthly', 'yearly', 'yearly', 'monthly', 'monthly', 'monthly', 'monthly', 'weekly', 'yearly',
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

  SEO_JOBS.forEach((job) => {
    routing.locales.forEach((locale) => {
      const cvPath = { ro: `/cv/${job.slug.ro}`, en: `/cv/${job.slug.en}` }
      const letterPath = { ro: `/scrisoare-intentie/${job.slug.ro}`, en: `/scrisoare-intentie/${job.slug.en}` }

      entries.push({
        url: `${baseUrl}/${locale}${cvPath[locale]}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: alternates(cvPath),
      })

      entries.push({
        url: `${baseUrl}/${locale}${letterPath[locale]}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
        alternates: alternates(letterPath),
      })
    })
  })

  return entries
}
