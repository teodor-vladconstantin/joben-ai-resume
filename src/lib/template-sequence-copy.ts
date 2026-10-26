// Copy for the template-download email sequence (confirmation + 5 steps).
// Step offsets count days from the lead's double opt-in confirmation.
// Step 5 is the only one with an offer: the existing 14-day Interview Pass
// (PASS_14D_PRICE_BANI), no discount code.
import type { AnonScanEmailLocale } from '@/lib/resend'

export type TemplateSequenceStep = 1 | 2 | 3 | 4 | 5

export const TEMPLATE_SEQUENCE_OFFSET_DAYS: Record<TemplateSequenceStep, number> = {
  1: 0,
  2: 2,
  3: 5,
  4: 9,
  5: 14,
}

export const TEMPLATE_SEQUENCE_STEPS: TemplateSequenceStep[] = [1, 2, 3, 4, 5]

export type TemplateSequenceCtaPath = '/free-ats-checker' | '/sign-up' | '/pricing'

type StepCopy = {
  subject: string
  heading: string
  body: string[]
  cta: string
  ctaPath: TemplateSequenceCtaPath
}

export const TEMPLATE_SEQUENCE_COPY: Record<AnonScanEmailLocale, Record<TemplateSequenceStep, StepCopy>> = {
  en: {
    1: {
      subject: 'Your CV template is ready: how to fill it well',
      heading: 'Let the template carry the layout, you bring the content.',
      body: [
        'Thanks for confirming. A clean template gives your CV its structure, and your words create the impression.',
        'Open with a two sentence summary: your role, your strongest skill and one result you delivered. Under each job, write three to five bullets that start with a verb and end with a measurable outcome.',
      ],
      cta: 'Check your CV with the free ATS scan',
      ctaPath: '/free-ats-checker',
    },
    2: {
      subject: 'How an ATS reads your CV',
      heading: 'Most employers filter applications before a person reads them.',
      body: [
        'An applicant tracking system reads your CV as plain text, in order: headings, dates, job titles, skills.',
        'A single column layout, standard headings such as Experience and Education, and real text instead of images keep that order intact. Tables, text boxes and icons can scramble it.',
      ],
      cta: 'Build your CV in the Joben editor',
      ctaPath: '/sign-up',
    },
    3: {
      subject: 'One change that makes a CV fit the job',
      heading: 'Mirror the job post in your own words.',
      body: [
        'Pick the five requirements in the job post that match your real experience. Use the same wording in your summary and bullets where it is true.',
        'Recruiters and ATS filters both look for that match. Joben can suggest these edits for you and shows every change before it is applied.',
      ],
      cta: 'Tailor your CV with Joben',
      ctaPath: '/sign-up',
    },
    4: {
      subject: 'A cover letter in three short paragraphs',
      heading: 'Keep the cover letter short and specific.',
      body: [
        'Paragraph one: why this company and this role. Paragraph two: the experience that fits, with one concrete result. Paragraph three: a clear next step, such as an interview.',
        'Half a page is enough. Address the letter to the hiring team and mention the role by name.',
      ],
      cta: 'Write your cover letter',
      ctaPath: '/sign-up',
    },
    5: {
      subject: 'Two weeks of Pro for your job search: 39 RON',
      heading: 'The 14-day Interview Pass covers a full application sprint.',
      body: [
        'The Interview Pass gives you 14 days of Pro access for 39 RON, paid once with no automatic renewal. Use it for AI tailoring, extra exports and cover letters while you apply.',
        'This is the last email in this series. Your free tools stay available either way.',
      ],
      cta: 'See the Interview Pass',
      ctaPath: '/pricing',
    },
  },
  ro: {
    1: {
      subject: 'Șablonul tău de CV e gata: cum îl completezi bine',
      heading: 'Șablonul dă structura, tu aduci conținutul.',
      body: [
        'Mulțumim pentru confirmare. Un șablon curat oferă structura CV-ului, iar cuvintele tale creează impresia.',
        'Începe cu un rezumat de două propoziții: rolul tău, cea mai puternică abilitate și un rezultat obținut. La fiecare job scrie trei până la cinci puncte care încep cu un verb și se încheie cu un rezultat măsurabil.',
      ],
      cta: 'Verifică CV-ul cu scanarea ATS gratuită',
      ctaPath: '/free-ats-checker',
    },
    2: {
      subject: 'Cum citește un ATS CV-ul tău',
      heading: 'Majoritatea angajatorilor filtrează aplicațiile înainte să le vadă un om.',
      body: [
        'Un sistem ATS citește CV-ul ca text simplu, în ordine: titluri, date, funcții, abilități.',
        'Un layout pe o singură coloană, titluri standard precum Experiență și Educație și text real în loc de imagini păstrează ordinea. Tabelele, casetele de text și iconițele o pot amesteca.',
      ],
      cta: 'Construiește-ți CV-ul în editorul Joben',
      ctaPath: '/sign-up',
    },
    3: {
      subject: 'O schimbare care potrivește CV-ul cu jobul',
      heading: 'Reia în cuvintele tale limbajul anunțului.',
      body: [
        'Alege cele cinci cerințe din anunț care se potrivesc cu experiența ta reală. Folosește aceleași formulări în rezumat și în puncte, acolo unde sunt adevărate.',
        'Recrutorii și filtrele ATS caută exact această potrivire. Joben poate sugera editările și îți arată fiecare modificare înainte să o aplici.',
      ],
      cta: 'Adaptează CV-ul cu Joben',
      ctaPath: '/sign-up',
    },
    4: {
      subject: 'O scrisoare de intenție în trei paragrafe scurte',
      heading: 'Păstreaz-o scurtă și concretă.',
      body: [
        'Paragraful unu: de ce această companie și acest rol. Paragraful doi: experiența potrivită, cu un rezultat concret. Paragraful trei: un pas următor clar, de exemplu un interviu.',
        'O jumătate de pagină ajunge. Adreseaz-o echipei de recrutare și numește rolul.',
      ],
      cta: 'Scrie scrisoarea de intenție',
      ctaPath: '/sign-up',
    },
    5: {
      subject: 'Două săptămâni de Pro pentru căutarea ta de job: 39 RON',
      heading: 'Pass-ul de Interviu de 14 zile acoperă un sprint complet de aplicări.',
      body: [
        'Pass-ul de Interviu îți dă 14 zile de acces Pro pentru 39 RON, plătite o singură dată, fără reînnoire automată. Îl folosești pentru adaptare cu AI, exporturi suplimentare și scrisori de intenție cât timp aplici.',
        'Este ultimul email din această serie. Uneltele gratuite rămân disponibile oricum.',
      ],
      cta: 'Vezi Pass-ul de Interviu',
      ctaPath: '/pricing',
    },
  },
}

export const TEMPLATE_CONFIRM_COPY: Record<AnonScanEmailLocale, {
  subject: string
  heading: string
  body: string
  cta: string
  footer: string
  pagePrompt: string
  pageButton: string
  pageDone: string
  pageAlready: string
  pageInvalid: string
}> = {
  en: {
    subject: 'Confirm your email to get CV tips from Joben',
    heading: 'One click to confirm your email.',
    body: 'Confirm that this address is yours and you get five short emails over two weeks with CV tips. If you did not ask for this, you can ignore this message.',
    cta: 'Confirm my email',
    footer: 'You are receiving this because you downloaded a CV template on joben.eu and ticked the box for tips by email.',
    pagePrompt: 'Confirm that this email address is yours to receive CV tips from Joben.',
    pageButton: 'Confirm my email',
    pageDone: 'Confirmed. Your first tips email is on its way.',
    pageAlready: 'Your email is already confirmed.',
    pageInvalid: 'This confirmation link is invalid or has expired.',
  },
  ro: {
    subject: 'Confirmă emailul ca să primești sfaturi de CV de la Joben',
    heading: 'Un click pentru a-ți confirma emailul.',
    body: 'Confirmă că adresa îți aparține și primești cinci emailuri scurte în două săptămâni, cu sfaturi pentru CV. Dacă nu ai cerut asta, poți ignora mesajul.',
    cta: 'Confirmă emailul',
    footer: 'Primești acest email pentru că ai descărcat un șablon de CV pe joben.eu și ai bifat căsuța pentru sfaturi pe email.',
    pagePrompt: 'Confirmă că această adresă de email îți aparține, ca să primești sfaturi de CV de la Joben.',
    pageButton: 'Confirmă emailul',
    pageDone: 'Confirmat. Primul email cu sfaturi e pe drum.',
    pageAlready: 'Emailul tău este deja confirmat.',
    pageInvalid: 'Linkul de confirmare este invalid sau a expirat.',
  },
}

export const TEMPLATE_SEQUENCE_FOOTER: Record<AnonScanEmailLocale, string> = {
  en: 'You are receiving this because you downloaded a CV template on joben.eu and agreed to tips by email.',
  ro: 'Primești acest email pentru că ai descărcat un șablon de CV pe joben.eu și ai acceptat sfaturi pe email.',
}
