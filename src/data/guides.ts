// Guides: /ro/ghiduri/[slug] and /en/guides/[slug]. Each guide carries its own
// Romanian and English content (own slug, title, text) and the pages link each
// other with hreflang. Adding a guide = adding one object here. The pages,
// metadata, Article + FAQPage JSON-LD, the direct-answer block, the sitemap
// entries and the llms.txt links are all generated from it.
import type { AppLocale } from '@/i18n/routing'
import { MORE_GUIDES } from './guides-more'
import { GLOSSARY } from './glossary'
import { COMPARISONS } from './comparisons'

/** guide = how-to article, glossary = one-term definition, compare = Joben vs alternative. */
export type GuideKind = 'guide' | 'glossary' | 'compare'

export interface GuideSection {
  /** H2. Phrase it as the question the section answers. */
  heading: string
  paragraphs: string[]
  items?: string[]
}

export interface GuideContent {
  slug: string
  /** H1 and headline in Article JSON-LD. Keep it <= 52 chars so the "| Joben" template stays under 60. */
  title: string
  /** Meta description, <= 155 chars. */
  description: string
  /** Direct answer shown right under the H1: 2-3 sentences. */
  answer: string
  sections: GuideSection[]
  /** Rendered visibly AND emitted as FAQPage JSON-LD. */
  faq: { question: string; answer: string }[]
}

export interface Guide {
  /** Defaults to 'guide'. Decides the URL segment and the hub the page is listed on. */
  kind?: GuideKind
  /** ISO dates (YYYY-MM-DD). Bump dateModified when the content changes. */
  datePublished: string
  dateModified: string
  content: Record<AppLocale, GuideContent>
}

const CORE_GUIDES: Guide[] = [
  {
    datePublished: '2026-10-15',
    dateModified: '2026-10-16',
    content: {
      ro: {
        slug: 'cv-citit-corect-de-ats',
        title: 'Cum scrii un CV pe care ATS-ul îl citește corect',
        description:
          'Ghid pentru un CV pe care ATS-ul îl citește corect: format de fișier, structură, titluri de secțiuni, cuvinte cheie și greșelile care strică parsarea.',
        answer:
          'Un ATS citește corect un CV cu text real, pe o singură coloană, cu titluri standard de secțiuni și cu datele de contact în corpul paginii. Exportă din editor în PDF cu text selectabil sau în DOCX, scoate tabelele și casetele de text și reia în CV formularea exactă din anunț. Verifici rezultatul copiind textul din fișier într-un editor simplu: dacă ordinea e cea corectă, parserul o va citi la fel.',
        sections: [
          {
            heading: 'Cum citește un ATS un CV?',
            paragraphs: [
              'Un ATS (Applicant Tracking System) nu se uită la pagină ca un om. Extrage textul din fișier în ordinea în care e stocat, apoi îl împarte în câmpuri: nume, date de contact, funcții, companii, perioade, studii, competențe. Recrutorul caută și filtrează apoi în aceste câmpuri.',
              'Din asta rezultă regula de bază: tot ce vrei să fie citit trebuie să fie text, iar ordinea textului în fișier trebuie să fie ordinea în care îl citește un om. Un CV frumos vizual poate avea textul amestecat în fișier, iar parserul vede exact acel amestec.',
            ],
          },
          {
            heading: 'Ce format de fișier folosesc, PDF sau DOCX?',
            paragraphs: [
              'Un PDF exportat din Word, Google Docs sau LaTeX conține text selectabil și este citit corect de majoritatea sistemelor actuale. DOCX este alegerea sigură când anunțul îl cere explicit sau când aplici într-un sistem vechi al unei companii mari.',
              'Un PDF făcut dintr-o imagine (o captură de ecran, o scanare, un export dintr-un instrument de design care rasterizează textul) nu are strat de text. Parserul îl vede gol, iar CV-ul apare în sistem fără experiență și fără competențe.',
            ],
            items: [
              'Deschide PDF-ul și încearcă să selectezi un paragraf cu mouse-ul. Dacă nu se selectează, fișierul nu are text.',
              'Nu proteja fișierul cu parolă și nu îl încărca într-un arhivator.',
              'Denumește-l cu numele tău: Prenume-Nume-CV.pdf. Recrutorul îl găsește mai ușor în descărcări.',
            ],
          },
          {
            heading: 'Ce structură și titluri de secțiuni citește corect?',
            paragraphs: [
              'Folosește o singură coloană, de sus în jos, în ordinea: date de contact, rezumat scurt, experiență profesională, educație, competențe, limbi străine. Parserul recunoaște titlurile uzuale și mapează conținutul de sub ele în câmpul potrivit.',
              'Un titlu creativ precum „Parcursul meu" sau „Ce știu să fac" poate lăsa secțiunea nemapată. Folosește „Experiență profesională", „Educație", „Competențe".',
              'La fiecare post scrie pe linii consecvente funcția, compania, localitatea și perioada, în același format peste tot, de exemplu 03/2022 - 09/2024. Un format de dată amestecat produce perioade greșite sau lipsă.',
            ],
            items: [
              'Pune numele, telefonul și e-mailul în corpul paginii. Unele parsere sar peste antet și subsol, iar datele de contact dispar.',
              'Scrie e-mailul și linkul de LinkedIn în clar, ca text.',
              'Folosește buline simple (• sau -). Simbolurile decorative pot apărea ca caractere ciudate.',
            ],
          },
          {
            heading: 'Ce elemente de design strică citirea unui CV?',
            paragraphs: [
              'Șabloanele cu bară laterală sau două coloane sunt cea mai frecventă cauză. Parserul citește linie cu linie, deci rândul din coloana stângă se lipește de rândul din coloana dreaptă și propoziții din secțiuni diferite se amestecă.',
              'Aceeași problemă o dau tabelele și casetele de text. Barele de nivel pentru competențe (cinci puncte, o bară umplută pe jumătate) nu transmit nimic într-un fișier text, așa că nivelul trebuie scris în cuvinte, de exemplu „Engleză: C1" sau „Excel: avansat, tabele pivot".',
            ],
            items: [
              'Coloane multiple și bare laterale: treci pe o singură coloană.',
              'Tabele și casete de text: înlocuiește-le cu paragrafe și liste.',
              'Text în imagini, logouri de companii, grafice: scrie informația ca text.',
              'Pictograme în loc de etichete (un plic în loc de „E-mail"): scrie eticheta.',
              'Antet și subsol cu informații importante: mută-le în corpul paginii.',
            ],
          },
          {
            heading: 'Cum aleg cuvintele cheie din anunț?',
            paragraphs: [
              'Copiază anunțul într-un document și marchează competențele, uneltele și certificările care apar la cerințele obligatorii sau de mai multe ori. Acestea sunt cuvintele după care filtrează recrutorul.',
              'Reia formularea exactă din anunț. Dacă anunțul cere „Google Analytics 4", scrie exact așa, fără să îl transformi în „analitică web". Când un termen are formă scurtă și lungă, pune-le pe amândouă, de exemplu „Search Engine Optimization (SEO)".',
              'Pune cuvintele în punctele de la experiență, lângă ce ai făcut cu ele, și adaugă doar ce ai folosit efectiv. O listă de cuvinte fără context se citește ca umplutură, iar la interviu ți se cer exemple.',
            ],
            items: [
              'Exemplu ilustrativ, punct slab: „Responsabil de campanii online."',
              'Exemplu ilustrativ, punct puternic: „Am gestionat campanii Google Ads și am urmărit conversiile în Google Analytics 4, reducând costul pe lead cu 22%."',
            ],
          },
          {
            heading: 'Cum verific singur dacă ATS-ul îmi citește CV-ul?',
            paragraphs: [
              'Deschide PDF-ul sau DOCX-ul, selectează tot (Ctrl+A), copiază și lipește într-un editor simplu, cum e Notepad. Rezultatul este foarte aproape de ce vede parserul.',
              'Verifică trei lucruri: ordinea secțiunilor este cea corectă, datele de contact sunt prezente și fiecare post are funcția, compania și perioada pe linii alăturate. Dacă textul apare amestecat sau lipsește, repară sursa și exportă din nou.',
              'Pentru o verificare automată, scanarea gratuită Joben îți dă un scor de la 0 la 100 și punctele de reparat. Scorul este estimarea Joben a lizibilității pentru ATS, deci folosește-l ca indicator.',
            ],
          },
        ],
        faq: [
          {
            question: 'Un ATS respinge automat CV-urile?',
            answer:
              'De regulă ATS-ul organizează candidaturile și le filtrează după criterii setate de recrutor, de exemplu întrebări eliminatorii sau cuvinte cheie. Dacă un CV este respins automat depinde de configurarea fiecărei companii. Un CV citit greșit pierde în căutări chiar și fără respingere automată.',
          },
          {
            question: 'Cât de lung trebuie să fie CV-ul pentru ATS?',
            answer:
              'Parserul nu are o limită de pagini. Recrutorul însă parcurge rapid, așa că o pagină este suficientă la început de carieră, iar două pagini se justifică doar când experiența relevantă nu încape.',
          },
          {
            question: 'Pot pune poză în CV dacă aplic printr-un ATS?',
            answer:
              'Parserul ignoră imaginile, deci poza nu afectează citirea textului. Pune-o dacă anunțul sau cultura companiei o cer și ține toate datele de contact ca text.',
          },
          {
            question: 'Trebuie să fac un CV separat pentru fiecare anunț?',
            answer:
              'Păstrează un CV de bază și ajustează-l pentru fiecare anunț: cuvintele cheie, ordinea punctelor de experiență și rezumatul. Competențele și realizările rămân cele reale.',
          },
        ],
      },
      en: {
        slug: 'cv-readable-by-ats',
        title: 'How to write a resume an ATS reads correctly',
        description:
          'A guide to a resume an ATS reads correctly: file format, structure, section titles, keywords and the mistakes that break parsing.',
        answer:
          'An ATS reads a resume correctly when it has real text in a single column, standard section titles and contact details in the body of the page. Export from your editor to a PDF with selectable text or to DOCX, remove tables and text boxes, and reuse the exact wording of the job posting. You can check the result by copying the text from the file into a plain editor: if the order is right, the parser will read it the same way.',
        sections: [
          {
            heading: 'How does an ATS read a resume?',
            paragraphs: [
              'An ATS (Applicant Tracking System) does not look at the page the way a person does. It extracts the text from the file in the order it is stored, then splits it into fields: name, contact details, job titles, companies, dates, education, skills. The recruiter then searches and filters on those fields.',
              'That gives you the basic rule: everything you want read has to be text, and the order of the text in the file has to be the order in which a person reads it. A resume that looks great can have its text scrambled inside the file, and the parser sees exactly that scramble.',
            ],
          },
          {
            heading: 'Which file format should I use, PDF or DOCX?',
            paragraphs: [
              'A PDF exported from Word, Google Docs or LaTeX contains selectable text and is read correctly by most current systems. DOCX is the safe choice when the posting asks for it explicitly or when you apply through an older system at a large company.',
              'A PDF made from an image (a screenshot, a scan, an export from a design tool that rasterizes the text) has no text layer. The parser sees it as empty, and the resume lands in the system with no experience and no skills.',
            ],
            items: [
              'Open the PDF and try to select a paragraph with your mouse. If it will not select, the file has no text.',
              'Leave the file without a password and do not upload it inside an archive.',
              'Name it after yourself: First-Last-Resume.pdf. Recruiters find it faster in their downloads.',
            ],
          },
          {
            heading: 'Which structure and section titles does an ATS read correctly?',
            paragraphs: [
              'Use a single column, top to bottom, in this order: contact details, short summary, work experience, education, skills, languages. The parser recognizes the usual titles and maps the content under them to the right field.',
              'A creative title such as "My journey" or "What I can do" can leave the section unmapped. Use "Work Experience", "Education", "Skills".',
              'For each job, write the title, company, location and dates on consistent lines, in the same format everywhere, for example 03/2022 - 09/2024. A mixed date format produces wrong or missing periods.',
            ],
            items: [
              'Put your name, phone number and email in the body of the page. Some parsers skip the header and footer, and the contact details disappear.',
              'Write your email and LinkedIn link out in full, as plain text.',
              'Use simple bullets (• or -). Decorative symbols can show up as strange characters.',
            ],
          },
          {
            heading: 'Which design elements break resume parsing?',
            paragraphs: [
              'Templates with a sidebar or two columns are the most common cause. The parser reads line by line, so a row from the left column gets glued to a row from the right column and sentences from different sections get mixed together.',
              'Tables and text boxes cause the same problem. Skill level bars (five dots, a half-filled bar) convey nothing in a text file, so write the level in words, for example "English: C1" or "Excel: advanced, pivot tables".',
            ],
            items: [
              'Multiple columns and sidebars: switch to a single column.',
              'Tables and text boxes: replace them with paragraphs and lists.',
              'Text inside images, company logos, charts: write the information as text.',
              'Icons in place of labels (an envelope instead of "Email"): write the label.',
              'Headers and footers holding important information: move it into the body of the page.',
            ],
          },
          {
            heading: 'How do I choose keywords from the job posting?',
            paragraphs: [
              'Copy the posting into a document and mark the skills, tools and certifications that appear under the required qualifications or more than once. These are the words a recruiter filters on.',
              'Reuse the exact wording of the posting. If the posting asks for "Google Analytics 4", write exactly that instead of turning it into "web analytics". When a term has a short and a long form, include both, for example "Search Engine Optimization (SEO)".',
              'Place the keywords in your experience bullets, next to what you did with them, and add only what you have actually used. A list of keywords with no context reads like filler, and an interviewer will ask for examples.',
            ],
            items: [
              'Illustrative example, weak bullet: "Responsible for online campaigns."',
              'Illustrative example, strong bullet: "Managed Google Ads campaigns and tracked conversions in Google Analytics 4, cutting cost per lead by 22%."',
            ],
          },
          {
            heading: 'How can I check whether an ATS reads my resume?',
            paragraphs: [
              'Open the PDF or DOCX, select everything (Ctrl+A), copy it and paste it into a plain editor such as Notepad. The result is very close to what the parser sees.',
              'Check three things: the sections are in the right order, the contact details are present, and each job has its title, company and dates on adjacent lines. If the text appears scrambled or is missing, fix the source and export again.',
              'For an automatic check, the free Joben scan gives you a score from 0 to 100 and the points to fix. The score is Joben’s estimate of readability for ATS, so use it as an indicator.',
            ],
          },
        ],
        faq: [
          {
            question: 'Does an ATS automatically reject resumes?',
            answer:
              'Usually an ATS organizes applications and filters them on criteria the recruiter sets, for example knockout questions or keywords. Whether a resume gets rejected automatically depends on how each company configures its system. A resume that is read wrongly loses out in searches even without an automatic rejection.',
          },
          {
            question: 'How long should a resume be for an ATS?',
            answer:
              'The parser has no page limit. Recruiters skim, though, so one page is enough early in your career, and two pages are justified only when your relevant experience does not fit.',
          },
          {
            question: 'Can I add a photo to my resume if I apply through an ATS?',
            answer:
              'The parser ignores images, so a photo does not affect how the text is read. Add one if the posting or the company culture expects it, and keep all contact details as text.',
          },
          {
            question: 'Do I need a separate resume for each job posting?',
            answer:
              'Keep one base resume and adjust it for each posting: the keywords, the order of the experience bullets and the summary. Your skills and achievements stay the real ones.',
          },
        ],
      },
    },
  },
]

export const GUIDES: Guide[] = [...CORE_GUIDES, ...MORE_GUIDES, ...GLOSSARY, ...COMPARISONS]

export const GUIDE_SEGMENT: Record<GuideKind, Record<AppLocale, string>> = {
  guide: { ro: 'ghiduri', en: 'guides' },
  glossary: { ro: 'glosar', en: 'glossary' },
  compare: { ro: 'comparatii', en: 'compare' },
}

export const kindOf = (guide: Guide): GuideKind => guide.kind ?? 'guide'

export function guidesOfKind(kind: GuideKind): Guide[] {
  return GUIDES.filter((guide) => kindOf(guide) === kind)
}

export function getGuide(locale: AppLocale, slug: string, kind: GuideKind = 'guide'): Guide | undefined {
  return GUIDES.find((guide) => kindOf(guide) === kind && guide.content[locale].slug === slug)
}

/** Locale-less path (what the i18n Link expects). */
export function guidePath(locale: AppLocale, guide: Guide): string {
  return '/' + GUIDE_SEGMENT[kindOf(guide)][locale] + '/' + guide.content[locale].slug
}
