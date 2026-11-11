import { Link } from '@/i18n/navigation'
import { getGuide, guidePath } from '@/data/guides'
import { ATS_SEO_RO } from '@/data/ats-checker-seo-ro'

// Romanian-only explainer under the ATS checker form (brief 02). The same FAQ
// array feeds the FAQPage JSON-LD in free-ats-checker/page.tsx.
const linkClass = 'text-foreground underline underline-offset-4 hover:text-primary'

export function AtsCheckerSeoContent() {
  const { sections, faq, related } = ATS_SEO_RO
  const guides = related.guides.flatMap((slug) => getGuide('ro', slug) ?? [])
  const terms = related.glossary.flatMap((slug) => getGuide('ro', slug, 'glossary') ?? [])

  return (
    <div className="mt-20 space-y-12">
      {sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{section.heading}</h2>
          {section.paragraphs.map((text) => (
            <p key={text} className="leading-relaxed text-muted-foreground">{text}</p>
          ))}
          {'items' in section && section.items && (
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              {section.items.map((item) => (
                <li key={item} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Întrebări frecvente</h2>
        {faq.map((item) => (
          <div key={item.question} className="space-y-2 rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">{item.question}</h3>
            <p className="leading-relaxed text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </section>

      <nav aria-label={related.heading} className="space-y-3">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{related.heading}</h2>
        <ul className="space-y-2">
          {guides.map((g) => (
            <li key={g.content.ro.slug}>
              <Link href={guidePath('ro', g)} className={linkClass}>{g.content.ro.title}</Link>
            </li>
          ))}
          {terms.map((g) => (
            <li key={g.content.ro.slug}>
              <Link href={guidePath('ro', g)} className={linkClass}>{g.content.ro.title}</Link>
            </li>
          ))}
          {related.pages.map((page) => (
            <li key={page.href}>
              <Link href={page.href} className={linkClass}>{page.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
