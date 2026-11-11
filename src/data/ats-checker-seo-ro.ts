// Romanian copy for /ro/verificare-cv-ats (brief 02). Every claim traces to code:
// 4 categories x 25 points and max 3 issues (api/public/ats-check/route.ts), 5 MB and
// PDF/DOCX (same route), 1 scan/day, first issue visible and the rest after email
// (FreeAtsCheckerClient.tsx), file never written to disk/DB (route.ts), 90-day
// retention of unclaimed scans (lib/data-retention.ts), prices (messages Pricing).
// Do not add user counts, reviews or "passes ATS" promises.

export interface AtsSeoSection {
  heading: string
  paragraphs: string[]
  items?: string[]
}

export const ATS_SEO_RO = {
  answer:
    'Verificarea ATS de la Joben analizează gratuit un CV în format PDF sau DOCX și afișează un scor de la 0 la 100, împreună cu primul punct de reparat. Scanarea merge fără cont. Scorul este o estimare a cât de ușor poate citi un ATS fișierul tău, iar fiecare instrument folosește criterii proprii.',
  sections: [
    {
      heading: 'Ce verifică scanerul ATS Joben?',
      paragraphs: [
        'Scorul total are 4 categorii, fiecare de maximum 25 de puncte.',
      ],
      items: [
        'Formatare ATS: cât de curat citește un software de recrutare fișierul, cu titluri standard de secțiuni și text în ordine logică de citire.',
        'Structură: prezența și ordinea secțiunilor de bază (date de contact, experiență, educație, aptitudini) și date scrise consecvent.',
        'Cuvinte cheie și impact: cuvinte relevante pentru rol și rezultate cuantificabile, cu cifre și efecte concrete în locul descrierilor vagi de atribuții.',
        'Claritate: bullet-uri și fraze scurte, ușor de parcurs, cu timp verbal consecvent.',
      ],
    },
    {
      heading: 'Cum primești scorul?',
      paragraphs: [
        'Încarci un fișier PDF sau DOCX de cel mult 5 MB și bifezi acordul pentru termeni și politica de confidențialitate (vârsta minimă este 16 ani). Scanarea durează de obicei câteva secunde. Scanerul lucrează cu textul extras din fișier, deci un PDF făcut din imagine, fără text selectabil, nu poate fi citit.',
        'Rezultatul conține scorul de la 0 la 100, un nivel de notă, punctajul pe cele 4 categorii și cel mult 3 probleme concrete de reparat. Prima problemă apare imediat.',
      ],
    },
    {
      heading: 'Ce este gratuit și ce vine după?',
      paragraphs: [
        'Scanarea, scorul, punctajul pe categorii și prima problemă sunt gratuite și nu cer cont. Limita este o scanare gratuită pe zi. Restul listei de probleme se deschide după ce introduci un email, iar raportul ajunge în inbox împreună cu până la 2 emailuri ulterioare cu sfaturi pentru CV, de la care te poți dezabona oricând. Emailul este opțional pentru a vedea scorul.',
        'Planul Gratuit al contului include 1 CV salvat, 5 exporturi PDF și 15 rescrieri AI de puncte pe lună. Evaluarea AI completă a CV-ului din cont folosește 5 categorii. Pass Interviu costă $8, plată unică pentru 14 zile de acces Pro, fără reînnoire automată, iar Pro costă $12 pe lună. Prețurile sunt finale, iar furnizorul nu este plătitor de TVA.',
      ],
    },
    {
      heading: 'Ce se întâmplă cu fișierul tău?',
      paragraphs: [
        'Joben nu salvează fișierul încărcat. Serverul îl citește în memorie pe durata unei singure cereri, extrage textul și nu scrie fișierul pe disc sau în baza de date. Textul extras este trimis furnizorului de AI (Anthropic), care întoarce analiza.',
        'Rezultatul scanării (scorul, categoriile și problemele găsite) se păstrează într-o înregistrare anonimă, folosită pentru raportul pe email. Înregistrările care nu sunt asociate unui cont se șterg după 90 de zile. Detaliile se găsesc în Politica de Confidențialitate.',
      ],
    },
    {
      heading: 'Cum interpretezi scorul ATS?',
      paragraphs: [
        'Scorul este o estimare făcută de un model AI după criteriile de mai sus. Scanerul este strict, iar un scor de 85 sau mai mult apare rar. Notele se împart în patru niveluri: sub 50, între 50 și 69, între 70 și 84 și de la 85 în sus.',
        'Folosește rezultatul ca listă de lucru: repari prima problemă, rulezi din nou a doua zi și urmărești categoria cu punctajul cel mai mic.',
      ],
    },
  ] satisfies AtsSeoSection[],
  faq: [
    {
      question: 'Ce formate de fișier pot încărca?',
      answer:
        'Scanerul acceptă fișiere PDF și DOCX cu text selectabil. Un PDF obținut dintr-o poză sau dintr-o scanare nu conține text și nu poate fi analizat.',
    },
    {
      question: 'Cât de mare poate fi fișierul?',
      answer: 'Limita este de 5 MB pentru fiecare fișier. Fișierele mai mari sunt respinse la încărcare.',
    },
    {
      question: 'Am nevoie de cont ca să verific CV-ul?',
      answer:
        'Scorul și prima problemă de reparat se văd fără cont. Contul gratuit este necesar când vrei să salvezi CV-ul, să îl exporți în PDF sau să folosești rescrierile AI.',
    },
    {
      question: 'Cât costă verificarea?',
      answer:
        'Scanarea este gratuită, cu o limită de o scanare pe zi. Planurile plătite sunt opționale: Pass Interviu costă $8 pentru 14 zile, iar Pro costă $12 pe lună. Detaliile sunt pe pagina de prețuri.',
    },
    {
      question: 'Pot verifica un CV scris în română?',
      answer:
        'Da. Scanerul tratează ca valide diacriticele, denumirile românești ale lunilor, cuvântul „Prezent” și titlurile de secțiuni în română. Pe pagina în română, problemele găsite apar în română.',
    },
    {
      question: 'Scorul arată cum va citi CV-ul un ATS real?',
      answer:
        'Scorul este o estimare făcută de un model AI, după 4 categorii proprii Joben. Firmele folosesc ATS-uri diferite, cu reguli proprii, deci un alt instrument poate da alt rezultat pentru același fișier. Scorul indică ce merită reparat, iar trecerea printr-un filtru depinde de fiecare angajator.',
    },
  ],
  related: {
    heading: 'Citește mai departe',
    guides: ['cv-citit-corect-de-ats', 'cum-adaptezi-cv-ul-la-anunt'],
    glossary: ['scor-ats', 'ce-este-ats', 'parsarea-cv-ului'],
    pages: [
      { href: '/sabloane-cv', label: 'Șabloane de CV optimizate ATS' },
      { href: '/pricing', label: 'Prețuri' },
      { href: '/ghiduri', label: 'Toate ghidurile' },
    ],
  },
} as const
