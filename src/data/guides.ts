// Guides served at /ro/ghiduri/[slug]. Romanian only: the route 404s on other
// locales and the sitemap emits no hreflang alternates for them.
// Adding a guide = adding one object here. The page, metadata, Article +
// FAQPage JSON-LD, the direct-answer block, the sitemap entry and the
// llms.txt link are all generated from it.

export interface GuideSection {
  /** H2. Phrase it as the question the section answers. */
  heading: string
  paragraphs: string[]
  items?: string[]
}

export interface Guide {
  slug: string
  /** H1 and headline in Article JSON-LD. Keep it <= 52 chars so the "| Joben" template stays under 60. */
  title: string
  /** Meta description, <= 155 chars. */
  description: string
  /** Direct answer shown right under the H1: 2-3 sentences. */
  answer: string
  /** ISO dates (YYYY-MM-DD). Bump dateModified when the content changes. */
  datePublished: string
  dateModified: string
  sections: GuideSection[]
  /** Rendered visibly AND emitted as FAQPage JSON-LD. */
  faq: { question: string; answer: string }[]
}

export const GUIDES: Guide[] = [
  {
    slug: 'cv-citit-corect-de-ats',
    title: 'Cum scrii un CV pe care ATS-ul îl citește corect',
    description:
      'Ghid pentru un CV pe care ATS-ul îl citește corect: format de fișier, structură, titluri de secțiuni, cuvinte cheie și greșelile care strică parsarea.',
    answer:
      'Un ATS citește corect un CV cu text real, pe o singură coloană, cu titluri standard de secțiuni și cu datele de contact în corpul paginii. Exportă din editor în PDF cu text selectabil sau în DOCX, scoate tabelele și casetele de text și reia în CV formularea exactă din anunț. Verifici rezultatul copiind textul din fișier într-un editor simplu: dacă ordinea e cea corectă, parserul o va citi la fel.',
    datePublished: '2026-10-15',
    dateModified: '2026-10-15',
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
        heading: 'Ce structură și ce titluri de secțiuni citește corect?',
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
          'Deschide PDF-ul sau DOCX-ul, selectează tot (Ctrl+A), copiază și lipește într-un editor simplu, cum e Notepad. Ce vezi acolo este foarte aproape de ce vede parserul.',
          'Verifică trei lucruri: ordinea secțiunilor este cea corectă, datele de contact sunt prezente și fiecare post are funcția, compania și perioada pe linii alăturate. Dacă textul apare amestecat sau lipsește, repară sursa și exportă din nou.',
          'Pentru o verificare automată, scanarea gratuită Joben îți dă un scor de la 0 la 100 și punctele de reparat. Scorul este estimarea Joben și nu rezultatul unui anumit ATS, deci folosește-l ca indicator de lizibilitate.',
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
]

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug)
}
