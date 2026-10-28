import type { Metadata } from 'next'
import { ArrowRight, Download } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { PageHero, wrap } from '@/components/marketing/section'
import { cn } from '@/lib/cn'
import { buttonVariants } from '@/components/ui/Button'
import { TrackedLink } from '@/components/ui/TrackedLink'
import { TemplateDownloadGate } from '@/components/seo/TemplateDownloadGate'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { atsCheckerPath } from '@/lib/ats-checker-path'
import { siteConfig } from '@/lib/content'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { GUIDES, guidePath } from '@/data/guides'
import { Link } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'

export const CV_TEMPLATES_SEGMENT: Record<AppLocale, string> = { ro: 'sabloane-cv', en: 'cv-templates' }

const DATE_PUBLISHED = '2026-10-16'
const DATE_MODIFIED = '2026-10-16'

const COPY: Record<
  AppLocale,
  {
    eyebrow: string
    title: string
    description: string
    answer: string
    updated: string
    bestFor: string
    includes: string
    downloadThis: string
    downloadOther: string
    howHeading: string
    steps: string[]
    atsHeading: string
    atsBody: string
    atsCta: string
    faqHeading: string
    faq: { question: string; answer: string }[]
    guidesHeading: string
    home: string
    ogLocale: string
  }
> = {
  ro: {
    eyebrow: 'Șabloane CV',
    title: 'Șabloane de CV gratuite, optimizate pentru ATS',
    description:
      'Descarcă gratuit șabloane de CV în format DOCX: clasic, pentru studenți și pentru schimbare de carieră. Pe o coloană, fără tabele, în română și engleză.',
    answer:
      'Șabloanele de mai jos sunt fișiere DOCX gratuite, pe o singură coloană, fără tabele sau casete de text, cu titluri standard și date de contact în corpul paginii. Le deschizi în Word sau Google Docs, înlocuiești textul dintre paranteze și exporți în PDF cu text selectabil. Fiecare are variantă în română și în engleză.',
    updated: 'Actualizat',
    bestFor: 'Se potrivește pentru',
    includes: 'Secțiuni incluse',
    downloadThis: 'Descarcă în română',
    downloadOther: 'Download in English',
    howHeading: 'Cum folosești un șablon',
    steps: [
      'Descarcă varianta în limba în care aplici și deschide-o în Word sau în Google Docs.',
      'Înlocuiește tot textul dintre paranteze pătrate cu informațiile tale și șterge ce nu se aplică.',
      'Rescrie rezumatul pentru fiecare anunț, cu titlul postului și două competențe cheie din cerințe.',
      'Scrie punctele de la experiență cu un verb de acțiune și un rezultat măsurabil.',
      'Exportă în PDF cu text selectabil sau salvează ca DOCX, apoi verifică fișierul final cu scanarea ATS gratuită.',
    ],
    atsHeading: 'Verifică CV-ul completat',
    atsBody:
      'După ce ai completat șablonul, încarcă fișierul în scanarea ATS gratuită Joben. Primești un scor de la 0 la 100 și punctele de reparat, fără cont.',
    atsCta: 'Scanează CV-ul gratuit',
    faqHeading: 'Întrebări frecvente',
    faq: [
      {
        question: 'Sunt șabloanele gratuite?',
        answer: 'Da. Le descarci fără cont și le poți folosi pentru orice candidatură.',
      },
      {
        question: 'De ce nu au design elaborat?',
        answer:
          'Pentru că un format simplu, pe o singură coloană, se citește corect și de recrutori, și de sistemele ATS. Coloanele, tabelele și casetele de text pot amesteca informațiile la parsare.',
      },
      {
        question: 'În ce program le editez?',
        answer: 'În Microsoft Word, Google Docs sau LibreOffice. Fișierele sunt DOCX obișnuite.',
      },
      {
        question: 'Pot adăuga poză sau culori?',
        answer: 'Poți, dar fiecare element adăugat poate afecta citirea de către ATS. Păstrează datele de contact ca text și verifică fișierul final cu scanarea gratuită.',
      },
      {
        question: 'Ce șablon aleg?',
        answer:
          'Clasic dacă ai experiență în domeniu, pentru studenți dacă ești la început de drum și pentru schimbare de carieră dacă îți schimbi domeniul sau revii după o pauză.',
      },
    ],
    guidesHeading: 'Ghiduri utile',
    home: 'Acasă',
    ogLocale: 'ro_RO',
  },
  en: {
    eyebrow: 'CV templates',
    title: 'Free ATS-friendly resume and CV templates (DOCX)',
    description:
      'Download free resume templates in Word (DOCX), no sign-up: classic, student and career change. Single column, ATS-friendly, ready to edit in Word or Google Docs.',
    answer:
      'The templates below are free DOCX files with a single column, no tables or text boxes, standard headings and contact details in the body of the page. You open them in Word or Google Docs, replace the text in brackets and export to a PDF with selectable text. Each comes in a Romanian and an English version.',
    updated: 'Updated',
    bestFor: 'Best for',
    includes: 'Sections included',
    downloadThis: 'Download in English',
    downloadOther: 'Descarcă în română',
    howHeading: 'How to use a template',
    steps: [
      'Download the version in the language you apply in and open it in Word or Google Docs.',
      'Replace all the text in square brackets with your information and delete what does not apply.',
      'Rewrite the summary for each posting, with the job title and two key skills from the requirements.',
      'Write experience bullets with an action verb and a measurable result.',
      'Export to a PDF with selectable text or save as DOCX, then check the final file with the free ATS scan.',
    ],
    atsHeading: 'Check your finished CV',
    atsBody:
      'After you fill in the template, upload the file to the free Joben ATS scan. You get a score from 0 to 100 and the points to fix, with no account.',
    atsCta: 'Scan your CV free',
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'Are the templates free?',
        answer: 'Yes. You download them without an account and can use them for any application.',
      },
      {
        question: 'Why is the design plain?',
        answer:
          'A simple single-column format reads correctly for recruiters and for ATS software alike. Columns, tables and text boxes can scramble information at parsing.',
      },
      {
        question: 'Which program do I edit them in?',
        answer: 'In Microsoft Word, Google Docs or LibreOffice. The files are ordinary DOCX.',
      },
      {
        question: 'Can I add a photo or colors?',
        answer: 'You can, but every element you add can affect how an ATS reads the file. Keep contact details as text and check the final file with the free scan.',
      },
      {
        question: 'Which template do I choose?',
        answer:
          'Classic if you have experience in the field, the student template if you are early in your career and the career-change template if you switch fields or return after a break.',
      },
    ],
    guidesHeading: 'Useful guides',
    home: 'Home',
    ogLocale: 'en_US',
  },
}

const path = (locale: AppLocale) => `/${locale}/${CV_TEMPLATES_SEGMENT[locale]}`

export function cvTemplatesMetadata(locale: AppLocale): Metadata {
  const copy = COPY[locale]
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: path(locale),
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, path(l)])),
        'x-default': path(routing.defaultLocale),
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: path(locale),
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: copy.title }],
      locale: copy.ogLocale,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: copy.title, description: copy.description, images: ['/og-image.png'] },
  }
}

export function CvTemplatesPage({ locale }: { locale: AppLocale }) {
  setRequestLocale(locale)
  const copy = COPY[locale]
  const other: AppLocale = locale === 'ro' ? 'en' : 'ro'
  const guideSlugs = ['cv-citit-corect-de-ats', 'cv-fara-experienta', 'cv-pentru-schimbare-de-cariera']
  const guideLinks = guideSlugs.flatMap((slug) => GUIDES.filter((g) => g.content.ro.slug === slug))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: copy.home, path: `/${locale}` },
        { name: copy.title, path: path(locale) },
      ]),
      {
        '@type': 'CollectionPage',
        name: copy.title,
        description: copy.description,
        inLanguage: locale,
        url: `${siteConfig.url}${path(locale)}`,
        datePublished: DATE_PUBLISHED,
        dateModified: DATE_MODIFIED,
        publisher: { '@id': `${siteConfig.url}/#organization` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: CV_TEMPLATES.map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'DigitalDocument',
              name: t.title[locale],
              description: t.description[locale],
              url: `${siteConfig.url}${t.file(locale)}`,
              encodingFormat: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              inLanguage: locale,
              isAccessibleForFree: true,
              publisher: { '@id': `${siteConfig.url}/#organization` },
            },
          })),
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: copy.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={jsonLd} />
      <Navbar />
      <main>
        <PageHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          intro={
            <span className="text-sm">
              {copy.updated}: <time dateTime={DATE_MODIFIED}>{DATE_MODIFIED}</time>
            </span>
          }
        />
        <div className={cn(wrap, 'space-y-12 py-12 sm:py-16')}>
        <div className="rounded-lg border border-border border-l-4 border-l-primary bg-card p-6 sm:p-8">
          <p className="text-lg leading-relaxed">{copy.answer}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {CV_TEMPLATES.map((t) => (
            <div key={t.id} className="space-y-4 rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary sm:p-8">
              <h2 className="text-xl font-semibold text-foreground">{t.title[locale]}</h2>
              <p className="text-muted-foreground leading-relaxed">{t.description[locale]}</p>
              <p className="text-sm text-foreground">
                <span className="font-semibold">{copy.bestFor}:</span> {t.bestFor[locale]}
              </p>
              <div>
                <p className="text-sm font-semibold text-foreground">{copy.includes}</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                  {t.structure[locale].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <TemplateDownloadGate
                  href={t.file(locale)}
                  ctaId={`template_${t.id}_${locale}`}
                  templateId={t.id}
                  className={`${buttonVariants('primary', 'md')} text-sm font-semibold inline-flex items-center gap-1.5`}
                >
                  <Download className="h-4 w-4" />
                  <span>{copy.downloadThis}</span>
                </TemplateDownloadGate>
                <TemplateDownloadGate
                  href={t.file(other)}
                  ctaId={`template_${t.id}_${other}`}
                  templateId={t.id}
                  className={`${buttonVariants('secondary', 'md')} text-sm font-semibold inline-flex items-center gap-1.5`}
                >
                  <Download className="h-4 w-4" />
                  <span>{copy.downloadOther}</span>
                </TemplateDownloadGate>
              </div>
            </div>
          ))}
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">{copy.howHeading}</h2>
          <ol className="list-decimal pl-5 space-y-2 text-muted-foreground leading-relaxed">
            {copy.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-card sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">{copy.atsHeading}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{copy.atsBody}</p>
          </div>
          <TrackedLink
            href={atsCheckerPath(locale)}
            ctaId="templates_ats_cta"
            className={`shrink-0 ${buttonVariants('primary', 'md')}`}
          >
            <span>{copy.atsCta}</span>
            <ArrowRight className="h-4 w-4" />
          </TrackedLink>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">{copy.faqHeading}</h2>
          {copy.faq.map((item) => (
            <div key={item.question} className="space-y-2 rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">{item.question}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </section>

        <nav aria-label={copy.guidesHeading} className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{copy.guidesHeading}</h2>
          <ul className="space-y-2">
            {guideLinks.map((g) => (
              <li key={g.content[locale].slug}>
                <Link href={guidePath(locale, g)} className="text-foreground underline underline-offset-4 hover:text-primary">
                  {g.content[locale].title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        </div>
      </main>
    </div>
  )
}
