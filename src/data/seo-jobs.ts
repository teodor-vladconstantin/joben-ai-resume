import type { AppLocale } from '@/i18n/routing'
import { MORE_SEO_JOBS } from './seo-jobs-more'

// Role data behind the ATS keyword-match API (/api/public/ats-fast-check),
// the resume-examples role pages (tools, certifications, ATS checklist,
// extra mistakes and bullets) and the /scrisoare-intentie cover letter pages.
export interface SeoJob {
  slug: { ro: string; en: string }
  // Matching role in src/data/resume-roles.ts; /{locale}/cv/{slug} 301s there.
  resumeRoleSlug: { ro: string; en: string }
  title: { ro: string; en: string }
  category: { ro: string; en: string }
  keywords: {
    // hardSkills/softSkills are parallel ro/en arrays: index i is the same skill.
    hardSkills: { ro: string[]; en: string[] }
    softSkills: { ro: string[]; en: string[] }
    tools: string[]
    certifications: { ro: string[]; en: string[] }
  }
  atsChecklist: { ro: string[]; en: string[] }
  commonMistakes: { ro: string[]; en: string[] }
  bulletExamples: {
    weak: { ro: string; en: string }
    strong: { ro: string; en: string }
  }[]
  coverLetterSample: {
    ro: { intro: string; body: string; closing: string }
    en: { intro: string; body: string; closing: string }
  }
}

const BASE_SEO_JOBS: SeoJob[] = [
  {
    slug: { ro: 'inginer-software', en: 'software-engineer' },
    resumeRoleSlug: { ro: 'inginer-software', en: 'software-engineer' },
    title: { ro: 'Inginer Software', en: 'Software Engineer' },
    category: { ro: 'IT & Tehnologie', en: 'IT & Software' },
    keywords: {
      hardSkills: {
        ro: ['Arhitectură microservicii', 'Testare automată (TDD)', 'Optimizare baze de date', 'Securitate web (OWASP)', 'RESTful APIs / GraphQL', 'CI/CD pipeline'],
        en: ['Microservices architecture', 'Automated testing (TDD)', 'Database optimization', 'Web security (OWASP)', 'RESTful APIs / GraphQL', 'CI/CD pipelines'],
      },
      softSkills: {
        ro: ['Rezolvare de probleme complexe', 'Mentorat colegi juniori', 'Colaborare cross-funcțională', 'Metodologii Agile / Scrum', 'Gândire algoritmică'],
        en: ['Complex problem solving', 'Mentoring junior engineers', 'Cross-functional collaboration', 'Agile / Scrum methodologies', 'Algorithmic thinking'],
      },
      tools: ['TypeScript', 'React', 'Node.js', 'Next.js', 'Python', 'Docker', 'Kubernetes', 'PostgreSQL', 'Git', 'AWS / GCP'],
      certifications: {
        ro: ['AWS Certified Solutions Architect', 'CKA (Kubernetes Administrator)', 'Oracle Certified Professional Java'],
        en: ['AWS Certified Solutions Architect', 'CKA (Kubernetes Administrator)', 'Oracle Certified Professional Java'],
      },
    },
    atsChecklist: {
      ro: [
        'Include link direct către profilul GitHub și LinkedIn în antet.',
        'Menționează clar stack-ul tehnologic utilizat la fiecare proiect sau companie.',
        'Cuantifică performanța: procent de reducere a latenței, număr de utilizatori activi, volume de trafic.',
        'Listează competențele ca text simplu, separate prin virgulă, fără tabele complexe.',
      ],
      en: [
        'Include direct clickable links to GitHub and LinkedIn profiles in the header.',
        'Explicitly state the tech stack used for each job entry.',
        'Quantify performance: latency reduction %, DAU/MAU scale, traffic handled.',
        'List skills as plain comma-separated text or bullet points, without complex tables.',
      ],
    },
    commonMistakes: {
      ro: [
        'Listarea a zeci de limbaje pe care le-ai testat doar o dată, fără profunzime.',
        'Lipsa oricărui link către cod real sau portofoliu de proiecte funcționale.',
        'Descrieri de rol pasive de tipul „Am fost responsabil de scrierea de cod”.',
      ],
      en: [
        'Listing 30 programming languages without demonstrable depth in any.',
        'Missing GitHub or portfolio link showing real-world code.',
        'Passive responsibility bullets like "Responsible for writing code".',
      ],
    },
    bulletExamples: [
      {
        weak: {
          ro: 'Am lucrat la backend-ul aplicației și am reparat bug-uri raportate de utilizatori.',
          en: 'Worked on backend application and fixed reported user bugs.',
        },
        strong: {
          ro: 'Am reproiectat serviciul de plăți în Node.js și PostgreSQL, reducând rata de erori cu 38% și timpul de procesare a tranzacțiilor de la 850ms la 190ms pentru peste 250k tranzacții lunare.',
          en: 'Redesigned core checkout payment service in Node.js & PostgreSQL, reducing transaction processing latency from 850ms to 190ms and error rates by 38% across 250K+ monthly orders.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă scriu cu privire la postul de Inginer Software din cadrul [Numele companiei]. Am [X] ani de experiență în construirea de aplicații web cu TypeScript, Node.js și PostgreSQL, iar descrierea rolului se potrivește direct cu proiectele la care lucrez în prezent.',
        body: 'La [Compania actuală] am coordonat migrarea unei aplicații monolitice către microservicii rulate în Docker și Kubernetes, ridicând disponibilitatea sistemului la 99,98% și reducând costurile de infrastructură AWS cu 22%. Am introdus testarea automată în pipeline-ul CI/CD, ceea ce a scurtat ciclul de release de la două săptămâni la două zile, și am îndrumat doi colegi juniori până la primele lor funcționalități livrate în producție. Aș aduce aceeași atenție la performanță și calitatea codului în echipa [Numele echipei].',
        closing: 'Vă mulțumesc pentru timpul acordat. Aș fi bucuros să discutăm într-un interviu tehnic despre cum pot contribui la produsul [Numele companiei].',
      },
      en: {
        intro: 'I am writing to apply for the Software Engineer role at [Company Name]. I have [X] years of experience building web applications with TypeScript, Node.js, and PostgreSQL, and the role description lines up closely with the systems I work on today.',
        body: 'At [Current Company], I led the migration of a monolithic application to microservices running on Docker and Kubernetes, lifting uptime to 99.98% and cutting AWS infrastructure costs by 22%. I added automated testing to our CI/CD pipeline, which shortened the release cycle from two weeks to two days, and I mentored two junior engineers through their first production releases. I would bring the same focus on performance and code quality to the [Team Name] team.',
        closing: 'Thank you for your time. I would welcome the chance to discuss in a technical interview how I can contribute to the [Company Name] product.',
      },
    },
  },
  {
    slug: { ro: 'contabil', en: 'accountant' },
    resumeRoleSlug: { ro: 'contabil', en: 'accountant' },
    title: { ro: 'Contabil', en: 'Accountant' },
    category: { ro: 'Financiar & Contabilitate', en: 'Finance & Accounting' },
    keywords: {
      hardSkills: {
        ro: ['Închidere de lună / an', 'Bilanț contabil', 'Declarații fiscale (D100, D112, D300, D390, D394)', 'e-Factura / SAF-T', 'Contabilitate primară și de gestiune', 'Analiză P&L'],
        en: ['Month-end close', 'Balance sheet reconciliation', 'Statutory tax declarations', 'e-Invoicing / SAF-T compliance', 'General ledger accounting', 'P&L variance analysis'],
      },
      softSkills: {
        ro: ['Atenție riguroasă la detalii', 'Integritate și confidențialitate', 'Organizare și respectare termene limită', 'Comunicare clară cu autoritățile fiscale (ANAF)'],
        en: ['Attention to detail', 'Integrity & confidentiality', 'Strict deadline adherence', 'Clear audit & regulatory communication'],
      },
      tools: ['SAGA C', 'Charisma ERP', 'SAP FI/CO', 'Excel / VLOOKUP / Pivot', 'WinMentor', 'NextUp'],
      certifications: {
        ro: ['Membru CECCAR (Contabil Autorizat / Expert Contabil)', 'Inspector Salarii', 'Curs Contabilitate IFRS'],
        en: ['ACCA / CECCAR Certified Accountant', 'Payroll Specialist Certification', 'IFRS Standards Course'],
      },
    },
    atsChecklist: {
      ro: [
        'Precizează explicit softurile ERP românești utilizate (SAGA, Charisma, SAP).',
        'Menționează experiența practică cu e-Factura, e-Transport și raportarea SAF-T.',
        'Specifică numărul de companii gestionate simultan sau cifra de afaceri a portofoliului.',
        'Include statutul de membru CECCAR dacă este aplicabil.',
      ],
      en: [
        'Explicitly state financial ERP systems mastered (SAP, Charisma, SAGA).',
        'Highlight statutory compliance and electronic tax audit (SAF-T) reporting.',
        'Indicate scale: revenue volume managed or number of client entities handled.',
      ],
    },
    commonMistakes: {
      ro: [
        'Omiterea denumirii softurilor contabile concrete (SAGA, SAP, Charisma), pe care recrutorii le caută după nume.',
        'Fără menționarea declarării electronice sau a conformității cu noile reglementări ANAF.',
        'Lipsa oricărei cifre privind volumul de documente procesat lunar.',
      ],
      en: [
        'Omitting the specific ERP software names (SAP, SAGA, Charisma) that recruiters search for by name.',
        'Missing details on regulatory compliance and electronic tax reporting.',
      ],
    },
    bulletExamples: [
      {
        weak: {
          ro: 'M-am ocupat de înregistrarea facturilor și întocmirea declarațiilor lunare.',
          en: 'Handled invoice registration and prepared monthly tax declarations.',
        },
        strong: {
          ro: 'Am gestionat contabilitatea completă pentru 14 companii din portofoliu (cifră cumulată de 18 mil. RON), implementând raportarea automată SAF-T și e-Factura fără nicio penalitate ANAF timp de 3 ani consecutivi.',
          en: 'Led end-to-end accounting for 14 corporate client accounts (combined revenue 18M+ RON), successfully integrating automated SAF-T reporting and e-Invoicing with zero audit penalties over 3 consecutive years.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă adresez candidatura mea pentru postul de Contabil din cadrul [Numele companiei]. Am [X] ani de experiență în contabilitate financiară și lucrez zilnic cu declarațiile fiscale, e-Factura și raportarea SAF-T cerute de ANAF.',
        body: 'La [Compania actuală] gestionez contabilitatea completă pentru un portofoliu de 14 companii, de la înregistrarea documentelor primare până la închiderea de lună și bilanțul anual. Am implementat raportarea SAF-T și e-Factura în SAGA și Charisma fără nicio penalitate ANAF în ultimii 3 ani și am redus timpul de închidere lunară de la 8 la 5 zile lucrătoare prin reconcilieri automatizate în Excel. Aș aduce aceeași rigoare și respectare a termenelor în departamentul financiar [Numele companiei].',
        closing: 'Vă mulțumesc pentru timpul acordat și rămân la dispoziția dumneavoastră pentru o întrevedere.',
      },
      en: {
        intro: 'I am applying for the Accountant position at [Company Name]. I have [X] years of financial accounting experience and work daily with statutory tax declarations, e-Invoicing, and SAF-T reporting.',
        body: 'At [Current Company], I run end-to-end accounting for a portfolio of 14 companies, from primary documents through month-end close and the annual balance sheet. I rolled out SAF-T reporting and e-Invoicing in SAGA and Charisma with zero tax authority penalties over the last 3 years, and I cut month-end close from 8 to 5 business days by automating reconciliations in Excel. I would bring the same rigor and deadline discipline to the [Company Name] finance team.',
        closing: 'Thank you for your consideration. I would be glad to meet and discuss how I can contribute.',
      },
    },
  },
  {
    slug: { ro: 'manager-de-proiect', en: 'project-manager' },
    resumeRoleSlug: { ro: 'manager-de-proiect', en: 'project-manager' },
    title: { ro: 'Manager de Proiect', en: 'Project Manager' },
    category: { ro: 'Management & Operațiuni', en: 'Management & Operations' },
    keywords: {
      hardSkills: {
        ro: ['Management de buget', 'Gestiunea riscurilor', 'Planificare Sprint / Gantt', 'Managementul stakeholderilor', 'Metodologie Scrum & Kanban', 'KPIs și raportare OKR'],
        en: ['Budget management', 'Risk mitigation', 'Sprint & Gantt planning', 'Stakeholder alignment', 'Scrum & Kanban methodologies', 'KPI & OKR tracking'],
      },
      softSkills: {
        ro: ['Leadership empatic', 'Negociere și rezolvare de conflicte', 'Comunicare asertivă', 'Delegare eficientă'],
        en: ['Empathetic leadership', 'Conflict resolution', 'Executive presentation', 'Strategic delegation'],
      },
      tools: ['Jira', 'Confluence', 'Asana', 'MS Project', 'Trello', 'Slack', 'Miro', 'ClickUp'],
      certifications: {
        ro: ['PMP (Project Management Professional)', 'Scrum Master (PSM I / CSM)', 'PRINCE2 Practitioner'],
        en: ['PMP (Project Management Professional)', 'Certified Scrum Master (CSM / PSM I)', 'PRINCE2 Practitioner'],
      },
    },
    atsChecklist: {
      ro: [
        'Menționează bugetul cumulat al proiectelor livrate (ex: peste 500.000 EUR).',
        'Specifică numărul membrilor din echipele coordonate.',
        'Include certificările recunoscute PMP / Agile în primele rânduri ale profilului.',
        'Evidențiază livrarea la termen (on-time) și în buget (on-budget).',
      ],
      en: [
        'Specify cumulative budget handled (e.g. $500K+).',
        'State team sizes managed across developers, designers, and QA.',
        'Place recognized credentials (PMP, CSM) prominently near the top.',
      ],
    },
    commonMistakes: {
      ro: [
        'Descrierea task-urilor administrative („am organizat ședințe zilnice”) fără rezultatul de business obținut.',
        'Lipsa mărimii echipei și a bugetului coordonat.',
      ],
      en: [
        'Describing administrative tasks without the delivery outcome or the risk they reduced.',
        'Omitting team scale and budget accountability.',
      ],
    },
    bulletExamples: [
      {
        weak: {
          ro: 'Am condus proiecte IT și am ținut legătura cu clienții.',
          en: 'Led IT projects and communicated with clients.',
        },
        strong: {
          ro: 'Am coordonat 4 proiecte software simultane (buget total 650k EUR) cu o echipă multidisciplinară de 16 specialiști, livrând toate produsele cu 2 săptămâni înainte de termen și crescând marja de profitabilitate cu 14%.',
          en: 'Directed 4 concurrent enterprise software projects (650K EUR total budget) with a 16-person cross-functional team, delivering all releases 2 weeks ahead of deadline while boosting project margin by 14%.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă transmit candidatura mea pentru rolul de Manager de Proiect din cadrul [Numele companiei]. Am [X] ani de experiență în livrarea de proiecte software la termen și în bugetul alocat, cu echipe de dezvoltare, design și QA.',
        body: 'La [Compania actuală] coordonez în paralel 4 proiecte cu un buget total de 650.000 EUR și o echipă de 16 specialiști. Am introdus planificarea pe sprinturi în Jira și un registru de riscuri revizuit săptămânal, ceea ce ne-a permis să livrăm toate release-urile cu 2 săptămâni înainte de termen și să creștem marja proiectelor cu 14%. Sunt certificat PMP și aș aplica aceeași disciplină de livrare inițiativelor [Numele companiei].',
        closing: 'Vă mulțumesc pentru atenție. Aș aprecia oportunitatea de a discuta despre proiectele pe care le aveți în plan.',
      },
      en: {
        intro: 'I am applying for the Project Manager role at [Company Name]. I have [X] years of experience delivering software projects on schedule and on budget with development, design, and QA teams.',
        body: 'At [Current Company], I run 4 concurrent projects with a combined budget of 650,000 EUR and a 16-person team. I introduced sprint planning in Jira and a risk register reviewed every week, which let us ship every release 2 weeks ahead of deadline and raise project margin by 14%. I hold the PMP certification and would apply the same delivery discipline to the initiatives at [Company Name].',
        closing: 'Thank you for your time. I would welcome the chance to discuss your upcoming projects.',
      },
    },
  },
  {
    slug: { ro: 'specialist-resurse-umane', en: 'hr-specialist' },
    resumeRoleSlug: { ro: 'manager-resurse-umane', en: 'hr-manager' },
    title: { ro: 'Specialist Resurse Umane', en: 'HR Specialist' },
    category: { ro: 'Resurse Umane & Recrutare', en: 'Human Resources' },
    keywords: {
      hardSkills: {
        ro: ['Recrutare end-to-end', 'Sourcing pe LinkedIn Recruiter', 'Onboarding & Retenție', 'Administrare personal în ReviSal / Reges', 'Legislația muncii (Codul Muncii)', 'Evaluare de performanță'],
        en: ['End-to-end talent acquisition', 'LinkedIn Recruiter sourcing', 'Onboarding & retention', 'Payroll & contract administration', 'Labor law compliance', 'Performance management'],
      },
      softSkills: {
        ro: ['Inteligență emoțională', 'Negociere oferte de angajare', 'Consiliere managerială', 'Interviuri structurate bazate pe competențe'],
        en: ['Emotional intelligence', 'Offer negotiation', 'Stakeholder advisement', 'Competency-based interviewing'],
      },
      tools: ['LinkedIn Recruiter', 'Workable', 'Greenhouse', 'BambooHR', 'ReviSal', 'Charisma HR', 'Slack', 'Notion'],
      certifications: {
        ro: ['Inspector Resurse Umane (curs acreditat ANC)', 'Certificare SHRM / CIPD', 'LinkedIn Certified Professional Recruiter'],
        en: ['SHRM-CP / CIPD Certified', 'LinkedIn Certified Professional Recruiter', 'HR Inspector (ANC-accredited course)'],
      },
    },
    atsChecklist: {
      ro: [
        'Menționează rata de retenție a noilor angajați la 6 sau 12 luni.',
        'Specifică numărul mediu de poziții închise lunar (ex: 8-12 roluri tehnice/lună).',
        'Include cunoașterea legislației muncii și administrarea ReviSal.',
        'Evidențiază timpul mediu de recrutare (Time-to-Hire) redus.',
      ],
      en: [
        'State 6-to-12-month candidate retention rates.',
        'Quantify monthly hiring volume (e.g. closed 8-12 specialized hires/mo).',
        'Demonstrate Time-to-Hire reductions achieved.',
      ],
    },
    commonMistakes: {
      ro: [
        'Formulări vagi precum „am făcut interviuri cu candidații” fără menționarea volumelor și ratelor de succes.',
        'Lipsa oricărui ATS sau instrument de sourcing nominalizat.',
      ],
      en: [
        'Vague statements like "interviewed candidates" with zero volume or offer acceptance rates.',
      ],
    },
    bulletExamples: [
      {
        weak: {
          ro: 'Am recrutat oameni noi și am redactat contracte de muncă.',
          en: 'Recruited new employees and prepared employment contracts.',
        },
        strong: {
          ro: 'Am condus procesul complet de recrutare pentru 42 de poziții tehnice și comerciale în 12 luni, reducând costul per angajare cu 30% și scăzând Time-to-Hire de la 45 la 26 de zile, cu o rată de retenție de 94% la 1 an.',
          en: 'Managed end-to-end recruitment for 42 technical and sales positions over 12 months, slashing cost-per-hire by 30% and time-to-hire from 45 to 26 days while sustaining a 94% 1-year retention rate.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă scriu pentru postul de Specialist Resurse Umane din cadrul [Numele companiei]. Am [X] ani de experiență în recrutare, onboarding și administrare de personal, cu accent pe roluri tehnice și comerciale.',
        body: 'La [Compania actuală] am condus recrutarea pentru 42 de poziții în 12 luni, folosind LinkedIn Recruiter și Workable, și am redus Time-to-Hire de la 45 la 26 de zile. Am construit un program de onboarding structurat care a menținut retenția la 94% după primul an și am administrat contractele și registrul ReviSal în conformitate cu Codul Muncii. Aș aduce aceeași atenție la experiența candidaților și la conformitate echipei [Numele companiei].',
        closing: 'Vă mulțumesc pentru timpul acordat și vă stau la dispoziție pentru o discuție.',
      },
      en: {
        intro: 'I am applying for the HR Specialist role at [Company Name]. I have [X] years of experience in recruitment, onboarding, and personnel administration, focused on technical and sales roles.',
        body: 'At [Current Company], I led hiring for 42 positions in 12 months using LinkedIn Recruiter and Workable, and cut time-to-hire from 45 to 26 days. I built a structured onboarding program that kept first-year retention at 94%, and I managed employment contracts and payroll records in line with labor law. I would bring the same care for candidate experience and compliance to the [Company Name] team.',
        closing: 'Thank you for your time. I would be glad to talk about how I can support your hiring plans.',
      },
    },
  },
  {
    slug: { ro: 'manager-vanzari', en: 'sales-manager' },
    resumeRoleSlug: { ro: 'manager-vanzari', en: 'sales-manager' },
    title: { ro: 'Manager Vânzări', en: 'Sales Manager' },
    category: { ro: 'Vânzări & Business Development', en: 'Sales & Business' },
    keywords: {
      hardSkills: {
        ro: ['Vânzări B2B / B2C', 'Negociere contracte mari', 'Pipeline management', 'Generare de lead-uri calificate', 'Prognoză vânzări (Forecasting)', 'Strategie Go-To-Market'],
        en: ['B2B / B2C sales', 'Contract closing', 'Pipeline velocity management', 'Inbound & outbound lead generation', 'Sales forecasting', 'Go-To-Market execution'],
      },
      softSkills: {
        ro: ['Persuasiune etică', 'Ascultare activă', 'Reziliență și orientare spre obiective', 'Relaționare de durată (Account Management)'],
        en: ['Strategic persuasion', 'Active listening', 'Quota-driven resilience', 'Key account relationship building'],
      },
      tools: ['Salesforce', 'HubSpot CRM', 'Pipedrive', 'Apollo.io', 'LinkedIn Sales Navigator', 'ZoomInfo'],
      certifications: {
        ro: ['Certified Professional Sales Person (CPSP)', 'Curs de negociere pentru executivi', 'HubSpot Sales Certified'],
        en: ['Certified Professional Sales Person (CPSP)', 'Executive Negotiation Certificate', 'HubSpot Sales Inbound Certified'],
      },
    },
    atsChecklist: {
      ro: [
        'Include procentul exact de depășire a cotei de vânzări (ex: 125% realizare target).',
        'Menționează valoarea contractelor încheiate (ex: deal-uri de peste 50.000 EUR).',
        'Specifică CRM-ul utilizat zilnic (Salesforce, HubSpot, Pipedrive).',
        'Detaliază creșterea anuală a portofoliului (YoY growth).',
      ],
      en: [
        'Always quantify quota achievement percentage (e.g. 125% of annual target).',
        'State deal sizes (e.g. average deal size $50K+).',
        'Explicitly name CRM software mastered.',
      ],
    },
    commonMistakes: {
      ro: [
        'CV fără cifre: fără volume vândute și targete atinse, recrutorul nu îți poate evalua rezultatele.',
        'Lipsa menționării tipului de clienți (B2B corporate sau retail).',
      ],
      en: [
        'A sales resume without numbers or quota metrics gives hiring managers nothing to evaluate.',
      ],
    },
    bulletExamples: [
      {
        weak: {
          ro: 'Am sunat clienți și am vândut servicii companiei.',
          en: 'Called clients and sold company services.',
        },
        strong: {
          ro: 'Am generat 1.8 milioane RON în venituri noi B2B într-un an, depășind targetul anual cu 34% prin semnarea a 28 de clienți corporate cheie și optimizarea ciclului de vânzare de la 60 la 35 de zile.',
          en: 'Generated 1.8M RON in net-new B2B revenue, exceeding annual quota by 34% by closing 28 key enterprise accounts and compressing average sales cycle from 60 down to 35 days.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă adresez candidatura mea pentru postul de Manager Vânzări din cadrul [Numele companiei]. Am [X] ani de experiență în vânzări B2B, negociere de contracte și conducerea unei echipe orientate pe target.',
        body: 'La [Compania actuală] am generat 1,8 milioane RON în venituri noi într-un an, depășind targetul anual cu 34% prin semnarea a 28 de clienți corporate. Am reorganizat pipeline-ul în Salesforce pe etape clare de calificare, ceea ce a scurtat ciclul mediu de vânzare de la 60 la 35 de zile, și am instruit trei colegi noi până la atingerea primului target trimestrial. Aș aduce aceeași disciplină comercială în extinderea portofoliului [Numele companiei].',
        closing: 'Vă mulțumesc pentru atenție și aștept cu interes o întâlnire în care să discutăm strategia de vânzări.',
      },
      en: {
        intro: 'I am applying for the Sales Manager position at [Company Name]. I have [X] years of experience in B2B sales, contract negotiation, and leading a quota-carrying team.',
        body: 'At [Current Company], I generated 1.8M RON in net-new revenue in one year, beating the annual target by 34% by signing 28 enterprise accounts. I restructured our Salesforce pipeline around clear qualification stages, which shortened the average sales cycle from 60 to 35 days, and I coached three new hires to their first quarterly quota. I would bring the same commercial discipline to growing the [Company Name] portfolio.',
        closing: 'Thank you for your consideration. I look forward to discussing your sales strategy in person.',
      },
    },
  },
]

export function getAllSeoJobSlugs(locale: AppLocale = 'ro'): string[] {
  return SEO_JOBS.map((j) => j.slug[locale])
}

export function getSeoJobBySlug(slug: string, locale: AppLocale = 'ro'): SeoJob | undefined {
  return SEO_JOBS.find((j) => j.slug[locale] === slug || j.slug.ro === slug || j.slug.en === slug)
}

export function getSeoJobForResumeRole(roleSlugEn: string): SeoJob | undefined {
  return SEO_JOBS.find((j) => j.resumeRoleSlug.en === roleSlugEn)
}

// Splits "RESTful APIs / GraphQL" into its alternatives. Fragments under 3
// chars ("CI" from "CI/CD", "CO" from "SAP FI/CO") are dropped because a bare
// substring that short matches almost any text; the full keyword still counts.
function alternativesOf(keyword: string | undefined): string[] {
  if (!keyword) return []
  const parts = keyword.split('/').map((p) => p.trim().toLowerCase()).filter((p) => p.length >= 3)
  return [keyword.trim().toLowerCase(), ...parts]
}

export function calculateJobKeywordMatch(
  text: string,
  job: SeoJob,
  locale: AppLocale = 'ro'
): { matchPercentage: number; foundKeywords: string[]; missingKeywords: string[] } {
  const other: AppLocale = locale === 'ro' ? 'en' : 'ro'
  // Whole-word match: "Git" must not hit "digital", "React" must not hit "reactive".
  const containsTerm = (term: string) =>
    new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu').test(text)
  const entries: { keyword: string; alternatives: string[] }[] = [
    ...(['hardSkills', 'softSkills'] as const).flatMap((group) =>
      job.keywords[group][locale].map((keyword, i) => ({
        keyword,
        alternatives: [...alternativesOf(keyword), ...alternativesOf(job.keywords[group][other][i])],
      }))
    ),
    ...job.keywords.tools.map((keyword) => ({ keyword, alternatives: alternativesOf(keyword) })),
  ]

  const foundKeywords: string[] = []
  const missingKeywords: string[] = []
  for (const { keyword, alternatives } of entries) {
    if (alternatives.some(containsTerm)) foundKeywords.push(keyword)
    else missingKeywords.push(keyword)
  }

  const matchPercentage = entries.length > 0
    ? Math.round((foundKeywords.length / entries.length) * 100)
    : 0

  return { matchPercentage, foundKeywords, missingKeywords }
}

export const SEO_JOBS: SeoJob[] = [...BASE_SEO_JOBS, ...MORE_SEO_JOBS]

const COVER_LETTER_SEGMENT: Record<AppLocale, string> = { ro: 'scrisoare-intentie', en: 'cover-letter' }

export function findSeoJob(locale: AppLocale, slug: string): SeoJob | undefined {
  return SEO_JOBS.find((job) => job.slug[locale] === slug)
}

/** Locale-less path (what the i18n Link expects). */
export function coverLetterPath(locale: AppLocale, job: SeoJob): string {
  return `/${COVER_LETTER_SEGMENT[locale]}/${job.slug[locale]}`
}
