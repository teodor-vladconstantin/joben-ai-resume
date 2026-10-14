import type { AppLocale } from '@/i18n/routing'

export interface SeoJob {
  slug: { ro: string; en: string }
  title: { ro: string; en: string }
  category: { ro: string; en: string }
  salaryRangeRo: string
  demandLevelRo: 'Foarte Mare' | 'Mare' | 'Medie'
  keywords: {
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

export const SEO_JOBS: SeoJob[] = [
  {
    slug: { ro: 'inginer-software', en: 'software-engineer' },
    title: { ro: 'Inginer Software / Programator', en: 'Software Engineer' },
    category: { ro: 'IT & Tehnologie', en: 'IT & Software' },
    salaryRangeRo: '8.000 - 22.000 RON net',
    demandLevelRo: 'Foarte Mare',
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
        ro: ['AWS Certified Solutions Architect', 'CKA (Kubernetes Administrator)', 'Certificare Oracle Java'],
        en: ['AWS Certified Solutions Architect', 'CKA (Kubernetes Administrator)', 'Oracle Certified Professional Java'],
      },
    },
    atsChecklist: {
      ro: [
        'Include link direct către profilul GitHub și LinkedIn în antet.',
        'Menționează clar stack-ul tehnologic utilizat la fiecare proiect sau companie.',
        'Cuantifică performanța: procent de reducere a latenței, număr de utilizatori activi, volume de trafic.',
        'Evită tabelele complexe pentru listarea competențelor (folosește liste separate prin virgule).',
      ],
      en: [
        'Include direct clickable links to GitHub and LinkedIn profiles in the header.',
        'Explicitly state tech stack used for each job entry.',
        'Quantify performance: latency reduction %, DAU/MAU scale, traffic handled.',
        'Avoid complex tables for skills listing (use bullet points or comma-separated lists).',
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
        intro: 'Vă adresez această scrisoare cu privire la oportunitatea de Inginer Software în cadrul companiei dumneavoastră. Cu peste 4 ani de experiență practică în construirea de sisteme web distribuite de înaltă performanță...',
        body: 'În rolul meu cel mai recent, am coordonat migrarea unei aplicații monolitice către o arhitectură scalabilă de microservicii, îmbunătățind disponibilitatea sistemului la 99.98% și scăzând costurile de infrastructură AWS cu 22%. Tehnologiile utilizate zilnic de echipa mea corespund direct cerințelor postului dumneavoastră...',
        closing: 'Aștept cu entuziasm oportunitatea de a discuta în cadrul unui interviu tehnic despre modul în care expertiza mea poate contribui la obiectivele echipei dumneavoastră.',
      },
      en: {
        intro: 'I am writing to express my strong enthusiasm for the Software Engineer role at your company. With over 4 years of proven hands-on experience designing and deploying high-scale web systems...',
        body: 'In my most recent role, I spearheaded the migration of a legacy monolithic platform into scalable microservices, lifting uptime to 99.98% and trimming cloud infrastructure costs by 22%...',
        closing: 'I look forward to discussing how my software architecture skills can directly accelerate your engineering goals.',
      },
    },
  },
  {
    slug: { ro: 'contabil', en: 'accountant' },
    title: { ro: 'Contabil / Specialist Financiar', en: 'Accountant' },
    category: { ro: 'Financiar & Contabilitate', en: 'Finance & Accounting' },
    salaryRangeRo: '5.500 - 12.000 RON net',
    demandLevelRo: 'Mare',
    keywords: {
      hardSkills: {
        ro: ['Închidere de lună / an', 'Bilanț contabil', 'Declarații fiscale (D100, D112, D300, D390, D394)', 'e-Factura / SAF-T', 'Contabilitate primară și de gestiune', 'Analiză P&L'],
        en: ['Month-end close', 'Balance sheet reconciliation', 'Statutory tax declarations', 'e-Invoicing / SAF-T compliance', 'General ledger accounting', 'P&L variance analysis'],
      },
      softSkills: {
        ro: ['Atenție riguroasă la detalii', 'Integritate și confidențialitate', 'Organizare și respectare termene limită', 'Comunicare clară cu autoritățile fiscale (ANAF)'],
        en: ['Attention to detail', 'Integrity & confidentiality', 'Strict deadline adherence', 'Clear audit & regulatory communication'],
      },
      tools: ['SAGA C', 'Charisma ERP', 'SAP FI/CO', 'Excel avansat (VLOOKUP, Pivot, XLOOKUP)', 'WinMentor', 'NextUp'],
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
        'Omiterea denumirii softurilor contabile concrete (ATS-ul filtrează după „SAGA” sau „SAP”).',
        'Fără menționarea declarării electronice sau a conformității cu noile reglementări ANAF.',
        'Lipsa oricărei cifre privind volumul de documente procesat lunar.',
      ],
      en: [
        'Omitting specific ERP software names which ATS parsers scan for directly.',
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
        intro: 'Vă adresez candidatura mea pentru poziția de Contabil în cadrul companiei dumneavoastră. Cu o experiență de peste 5 ani în contabilitate financiară și expertiză aprofundată în cerințele fiscale actuale din România...',
        body: 'De-a lungul activității mele, am asigurat închiderea lunară a balanței contabile, întocmirea situațiilor financiare anuale și optimizarea proceselor de facturare. Stăpânirea excelentă a ERP-urilor și a analizei financiare îmi permite să preiau rapid responsabilitățile departamentului dumneavoastră...',
        closing: 'Vă mulțumesc pentru timpul acordat și rămân la dispoziția dumneavoastră pentru stabilirea unei întrevederi.',
      },
      en: {
        intro: 'I am delighted to submit my application for the Accountant position at your organization. Bringing over 5 years of rigorous accounting practice and in-depth expertise in statutory standards...',
        body: 'Throughout my career, I have managed month-end financial closings, annual balance sheets, and automated reporting systems. My proficiency in ERP solutions and variance analysis will deliver immediate value to your team...',
        closing: 'Thank you for your consideration, and I look forward to meeting with you to discuss how I can contribute.',
      },
    },
  },
  {
    slug: { ro: 'manager-de-proiect', en: 'project-manager' },
    title: { ro: 'Manager de Proiect / Project Manager', en: 'Project Manager' },
    category: { ro: 'Management & Operațiuni', en: 'Management & Operations' },
    salaryRangeRo: '8.500 - 18.000 RON net',
    demandLevelRo: 'Foarte Mare',
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
        'Descrierea task-urilor administrative („am organizat ședințe zilnice”) în loc de realizări de business.',
        'Lipsa mărimii echipei și a bugetului coordonat.',
      ],
      en: [
        'Focusing on administrative tasks instead of delivery outcomes and risk mitigation.',
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
          en: 'Directed 4 concurrent enterprise software projects ($650K total budget) with a 16-person cross-functional team, delivering all releases 2 weeks ahead of deadline while boosting project margin by 14%.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă transmit interesul meu activ pentru rolul de Project Manager în cadrul echipei dumneavoastră. Cu un istoric dovedit în livrarea de proiecte strategice complexe în timp și în bugetul alocat...',
        body: 'Pe parcursul ultimilor ani am coordonat echipe tehnice și comerciale pentru implementarea cu succes a peste 20 de proiecte la scară largă. Experiența mea în metodologia Agile și managementul riscurilor asigură predictibilitate și eficiență maximă...',
        closing: 'Aștept cu interes oportunitatea de a discuta despre cum pot accelera derularea inițiativelor din compania dumneavoastră.',
      },
      en: {
        intro: 'I am excited to submit my candidacy for the Project Manager position at your company. With a solid track record of delivering multifaceted initiatives strictly on schedule and under budget...',
        body: 'Over the past 5 years, I have orchestrated cross-functional engineering and design squads to roll out over 20 large-scale releases. My deep background in Scrum and risk mitigation ensures operational momentum...',
        closing: 'I look forward to discussing how my project delivery framework can benefit your upcoming roadmaps.',
      },
    },
  },
  {
    slug: { ro: 'specialist-resurse-umane', en: 'hr-specialist' },
    title: { ro: 'Specialist Resurse Umane / Recrutor HR', en: 'HR Specialist' },
    category: { ro: 'Resurse Umane & Recrutare', en: 'Human Resources' },
    salaryRangeRo: '5.000 - 11.500 RON net',
    demandLevelRo: 'Mare',
    keywords: {
      hardSkills: {
        ro: ['Recrutare end-to-end', 'Sourcing pe LinkedIn Recruiter', 'Onboarding & Retenție', 'Administrare personal (ReviSal / Reges)', 'Legislația muncii (Codul Muncii)', 'Evaluare de performanță'],
        en: ['End-to-end talent acquisition', 'LinkedIn Recruiter sourcing', 'Onboarding & retention', 'Payroll & contract administration', 'Labor law compliance', 'Performance management'],
      },
      softSkills: {
        ro: ['Inteligență emoțională', 'Negociere oferte de angajare', 'Consiliere managerială', 'Interviuri structurate bazate pe competențe'],
        en: ['Emotional intelligence', 'Offer negotiation', 'Stakeholder advisement', 'Competency-based interviewing'],
      },
      tools: ['LinkedIn Recruiter', 'Workable', 'Greenhouse', 'BambooHR', 'ReviSal', 'Charisma HR', 'Slack', 'Notion'],
      certifications: {
        ro: ['Inspector Resurse Umane (acreditat ANC)', 'Certificare SHRM / CIPD', 'Recruiter Academy Certified'],
        en: ['SHRM-CP / CIPD Certified', 'LinkedIn Certified Professional Recruiter', 'HR Administration Certification'],
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
        intro: 'Vă adresez dorința mea de a mă alătura echipei dumneavoastră în rolul de Specialist Resurse Umane. Cu un parcurs de peste 4 ani în atragerea talentelor și dezvoltarea culturii organizaționale...',
        body: 'Am gestionat cu succes atât procesele strategice de recrutare în medii competitive, cât și programele de integrare și conformitate cu legislația muncii. Capacitatea mea de a identifica candidații ideali și de a optimiza experiența angajaților va sprijini direct creșterea organizației...',
        closing: 'Vă stau cu plăcere la dispoziție pentru a stabili o discuție aprofundată.',
      },
      en: {
        intro: 'I am delighted to express my candidacy for the HR Specialist opening at your company. With over 4 years of dedicated talent acquisition and employee relations experience...',
        body: 'I have successfully orchestrated full-lifecycle recruiting sprints in high-competition sectors while championing structured onboarding programs that retain top performers...',
        closing: 'I look forward to discussing how my strategic HR approach can support your organizational expansion.',
      },
    },
  },
  {
    slug: { ro: 'manager-vanzari', en: 'sales-manager' },
    title: { ro: 'Manager Vânzări / Sales Specialist', en: 'Sales Manager' },
    category: { ro: 'Vânzări & Business Development', en: 'Sales & Business' },
    salaryRangeRo: '7.000 - 20.000+ RON (bază + comision)',
    demandLevelRo: 'Foarte Mare',
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
        ro: ['Certified Professional Sales Person (CPSP)', 'Curs Negociere Harvard', 'HubSpot Sales Certified'],
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
        'CV fără cifre: un CV de vânzări fără volume vândute și targete atinse este automat descalificat de recrutor.',
        'Lipsa menționării tipului de clienți (B2B corporate vs. retail).',
      ],
      en: [
        'A sales resume without numbers or quota metrics is immediately discarded by hiring managers.',
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
          en: 'Generated 1.8M RON in net-new B2B pipeline, exceeding annual quota by 34% by closing 28 key enterprise accounts and compressing average sales cycle from 60 down to 35 days.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă adresez scrisoarea mea de intenție pentru poziția de Manager Vânzări în cadrul companiei dumneavoastră. Cu un palmares solid în depășirea obiectivelor comerciale și negocierea de parteneriate strategice B2B...',
        body: 'Abordarea mea consultativă și stăpânirea avansată a instrumentelor moderne de vânzări au permis echipei mele să atingă o creștere susținută a veniturilor. Sunt motivat să aduc această disciplină și energie comercială în expansiunea portofoliului dumneavoastră...',
        closing: 'Aștept cu mult interes oportunitatea de a discuta despre strategia de vânzări într-o întâlnire directă.',
      },
      en: {
        intro: 'I am enthusiastic about applying for the Sales Manager position. With a verifiable track record of consistent quota over-attainment and multi-stakeholder contract closing...',
        body: 'My consultative selling style and disciplined pipeline stewardship have continuously translated into accelerated quarterly revenues. I am eager to apply this proactive mindset to drive your growth metrics...',
        closing: 'I look forward to discussing commercial roadmaps during a personal interview.',
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

export function calculateJobKeywordMatch(
  text: string,
  job: SeoJob,
  locale: AppLocale = 'ro'
): { matchPercentage: number; foundKeywords: string[]; missingKeywords: string[] } {
  const lowerText = text.toLowerCase()
  const allKeywords = [
    ...job.keywords.hardSkills[locale],
    ...job.keywords.softSkills[locale],
    ...job.keywords.tools,
  ]

  const foundKeywords: string[] = []
  const missingKeywords: string[] = []

  allKeywords.forEach((kw) => {
    if (lowerText.includes(kw.toLowerCase())) {
      foundKeywords.push(kw)
    } else {
      missingKeywords.push(kw)
    }
  })

  const matchPercentage = allKeywords.length > 0
    ? Math.round((foundKeywords.length / allKeywords.length) * 100)
    : 0

  return { matchPercentage, foundKeywords, missingKeywords }
}
