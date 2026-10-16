// Cover letter jobs 6-10. Same shape as seo-jobs.ts. Copy rules: no em dashes,
// no "X, not Y" phrasing, samples use [placeholders] and illustrative numbers.
import type { SeoJob } from './seo-jobs'

export const MORE_SEO_JOBS: SeoJob[] = [
  {
    slug: { ro: 'specialist-suport-clienti', en: 'customer-support-specialist' },
    resumeRoleSlug: { ro: 'specialist-suport-clienti', en: 'customer-support-specialist' },
    title: { ro: 'Specialist Suport Clienți', en: 'Customer Support Specialist' },
    category: { ro: 'Servicii clienți', en: 'Customer Service' },
    keywords: {
      hardSkills: {
        ro: ['Rezolvare tichete', 'Suport pe chat și e-mail', 'Gestionarea reclamațiilor', 'Baza de cunoștințe', 'Raportare CSAT', 'Escaladare cazuri'],
        en: ['Ticket resolution', 'Chat and email support', 'Complaint handling', 'Knowledge base', 'CSAT reporting', 'Case escalation'],
      },
      softSkills: {
        ro: ['Empatie', 'Comunicare clară', 'Răbdare', 'Lucru sub presiune', 'Orientare spre soluții'],
        en: ['Empathy', 'Clear communication', 'Patience', 'Working under pressure', 'Solution orientation'],
      },
      tools: ['Zendesk', 'Freshdesk', 'Intercom', 'HubSpot', 'Slack', 'Excel'],
      certifications: {
        ro: ['HDI Customer Service Representative', 'Curs de comunicare cu clienții'],
        en: ['HDI Customer Service Representative', 'Customer communication course'],
      },
    },
    atsChecklist: {
      ro: [
        'Menționează uneltele de ticketing folosite, cu numele exact.',
        'Scrie volumul de tichete sau de interacțiuni pe zi.',
        'Include metricile de calitate: CSAT, timp de prim răspuns, timp de rezolvare.',
        'Pune limbile străine cu nivelul scris în cuvinte.',
      ],
      en: [
        'Name the ticketing tools you used, spelled exactly.',
        'State the ticket or interaction volume per day.',
        'Include quality metrics: CSAT, first response time, resolution time.',
        'List foreign languages with the level written in words.',
      ],
    },
    commonMistakes: {
      ro: [
        'Scrii „am răspuns la clienți” fără volum și rezultate.',
        'Lipsesc metricile de satisfacție și de timp.',
        'Nu spui cum ai gestionat cazurile dificile.',
      ],
      en: [
        'Writing "answered customers" without volume and results.',
        'Missing satisfaction and time metrics.',
        'No mention of how you handled difficult cases.',
      ],
    },
    bulletExamples: [
      {
        weak: {
          ro: 'Am răspuns la întrebările clienților.',
          en: 'Answered customer questions.',
        },
        strong: {
          ro: 'Am gestionat peste 60 de tichete pe zi în Zendesk, cu CSAT de 96% și timp mediu de prim răspuns sub 10 minute.',
          en: 'Handled over 60 tickets a day in Zendesk, with a 96% CSAT and an average first response time under 10 minutes.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă scriu pentru postul de Specialist Suport Clienți din cadrul [Numele companiei]. Am [X] ani de experiență în suport pe chat și e-mail, iar produsul vostru se potrivește cu domeniul în care lucrez și îmi place să explic.',
        body: 'La [Compania actuală] am gestionat peste 60 de tichete pe zi în Zendesk, cu un CSAT de 96% și un timp mediu de prim răspuns sub 10 minute. Am scris 25 de articole pentru baza de cunoștințe, ceea ce a redus numărul de tichete repetitive cu aproximativ 15%. Rămân calm când un client este nemulțumit și caut soluția care rezolvă problema din prima interacțiune.',
        closing: 'Vă mulțumesc pentru timp. Aș fi bucuros să discutăm într-un interviu cum pot contribui la experiența clienților [Numele companiei].',
      },
      en: {
        intro: 'I am writing to apply for the Customer Support Specialist role at [Company Name]. I have [X] years of experience in chat and email support, and your product sits in a field I work in and enjoy explaining.',
        body: 'At [Current Company], I handled over 60 tickets a day in Zendesk with a 96% CSAT and an average first response time under 10 minutes. I wrote 25 knowledge base articles, which cut repetitive tickets by about 15%. I stay calm when a customer is upset and look for the fix that solves the problem in the first interaction.',
        closing: 'Thank you for your time. I would welcome an interview to discuss how I can contribute to the [Company Name] customer experience.',
      },
    },
  },
  {
    slug: { ro: 'agent-vanzari', en: 'sales-representative' },
    resumeRoleSlug: { ro: 'agent-vanzari', en: 'sales-representative' },
    title: { ro: 'Agent de Vânzări', en: 'Sales Representative' },
    category: { ro: 'Vânzări', en: 'Sales' },
    keywords: {
      hardSkills: {
        ro: ['Prospectare B2B', 'Negociere', 'Prezentări de produs', 'Gestionarea pipeline-ului', 'Închiderea vânzărilor', 'Raportare de vânzări'],
        en: ['B2B prospecting', 'Negotiation', 'Product demos', 'Pipeline management', 'Closing deals', 'Sales reporting'],
      },
      softSkills: {
        ro: ['Persuasiune', 'Reziliență', 'Ascultare activă', 'Orientare spre rezultate', 'Construirea relațiilor'],
        en: ['Persuasion', 'Resilience', 'Active listening', 'Results orientation', 'Relationship building'],
      },
      tools: ['HubSpot', 'Salesforce', 'LinkedIn Sales Navigator', 'Pipedrive', 'Excel', 'Zoom'],
      certifications: {
        ro: ['HubSpot Sales Software Certification', 'Curs de tehnici de vânzare'],
        en: ['HubSpot Sales Software Certification', 'Sales techniques course'],
      },
    },
    atsChecklist: {
      ro: [
        'Scrie targetul și procentul de realizare, cu perioada.',
        'Menționează CRM-ul folosit, cu numele exact.',
        'Include numărul de conturi noi și valoarea vânzărilor.',
        'Pune tipul de clienți (B2B, B2C) și industria.',
      ],
      en: [
        'State the target and attainment percentage, with the period.',
        'Name the CRM you used, spelled exactly.',
        'Include the number of new accounts and the sales value.',
        'Add the client type (B2B, B2C) and the industry.',
      ],
    },
    commonMistakes: {
      ro: [
        'Scrii „am vândut” fără target, valoare sau număr de clienți.',
        'Lipsește ciclul mediu de vânzare.',
        'Nu menționezi uneltele de CRM și de prospectare.',
      ],
      en: [
        'Writing "sold" without a target, value or number of clients.',
        'Missing the average sales cycle.',
        'No mention of CRM and prospecting tools.',
      ],
    },
    bulletExamples: [
      {
        weak: {
          ro: 'Am vândut produse către clienți noi.',
          en: 'Sold products to new clients.',
        },
        strong: {
          ro: 'Am depășit targetul trimestrial cu 18% (420.000 RON), deschizând 35 de conturi B2B noi prin prospectare directă și urmărire în HubSpot.',
          en: 'Exceeded the quarterly target by 18% (RON 420,000), opening 35 new B2B accounts through direct prospecting and follow-up in HubSpot.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă scriu pentru postul de Agent de Vânzări din cadrul [Numele companiei]. Am [X] ani de experiență în vânzări B2B și am urmărit cu interes extinderea voastră pe piața [piața].',
        body: 'La [Compania actuală] am depășit targetul trimestrial cu 18% (420.000 RON), deschizând 35 de conturi noi prin prospectare directă și urmărire constantă în HubSpot. Ciclul meu mediu de vânzare este de 6 săptămâni, iar cea mai mare parte a clienților noi a revenit cu comenzi repetate. Aș aplica aceeași disciplină de pipeline în echipa [Numele echipei].',
        closing: 'Vă mulțumesc pentru timp. Aș fi încântat să discutăm într-un interviu despre targetele echipei și despre cum pot contribui.',
      },
      en: {
        intro: 'I am writing to apply for the Sales Representative role at [Company Name]. I have [X] years of B2B sales experience and have followed your expansion into the [market] market with interest.',
        body: 'At [Current Company], I exceeded the quarterly target by 18% (RON 420,000), opening 35 new accounts through direct prospecting and steady follow-up in HubSpot. My average sales cycle is 6 weeks, and most new clients came back with repeat orders. I would bring the same pipeline discipline to the [Team Name] team.',
        closing: 'Thank you for your time. I would be glad to discuss the team\'s targets in an interview and how I can contribute.',
      },
    },
  },
  {
    slug: { ro: 'recrutor', en: 'recruiter' },
    resumeRoleSlug: { ro: 'recrutor', en: 'recruiter' },
    title: { ro: 'Recrutor', en: 'Recruiter' },
    category: { ro: 'Resurse Umane', en: 'Human Resources' },
    keywords: {
      hardSkills: {
        ro: ['Recrutare end-to-end', 'Sourcing', 'Interviuri structurate', 'Negociere de ofertă', 'Employer branding', 'Raportare time-to-hire'],
        en: ['End-to-end recruiting', 'Sourcing', 'Structured interviews', 'Offer negotiation', 'Employer branding', 'Time-to-hire reporting'],
      },
      softSkills: {
        ro: ['Comunicare', 'Evaluarea oamenilor', 'Discreție', 'Organizare', 'Colaborare cu managerii'],
        en: ['Communication', 'Assessing people', 'Discretion', 'Organization', 'Working with hiring managers'],
      },
      tools: ['LinkedIn Recruiter', 'Workable', 'Greenhouse', 'Teamtailor', 'Excel', 'Google Workspace'],
      certifications: {
        ro: ['Curs de recrutare și selecție', 'Certificare în interviuri pe competențe'],
        en: ['Recruitment and selection course', 'Competency-based interviewing certification'],
      },
    },
    atsChecklist: {
      ro: [
        'Scrie numărul de poziții închise și perioada.',
        'Include time-to-hire înainte și după.',
        'Menționează ATS-urile și platformele de sourcing, cu numele exact.',
        'Pune domeniile pentru care ai recrutat (IT, vânzări, producție).',
      ],
      en: [
        'State the number of roles closed and the period.',
        'Include time-to-hire before and after.',
        'Name the ATS and sourcing platforms, spelled exactly.',
        'Add the areas you recruited for (IT, sales, production).',
      ],
    },
    commonMistakes: {
      ro: [
        'Scrii „am recrutat personal” fără număr de poziții și timpi.',
        'Lipsesc canalele de sourcing și rata lor de succes.',
        'Nu menționezi colaborarea cu managerii de angajare.',
      ],
      en: [
        'Writing "recruited staff" without the number of roles and timings.',
        'Missing the sourcing channels and their success rate.',
        'No mention of working with hiring managers.',
      ],
    },
    bulletExamples: [
      {
        weak: {
          ro: 'Am recrutat personal pentru companie.',
          en: 'Recruited staff for the company.',
        },
        strong: {
          ro: 'Am închis 42 de poziții IT într-un an, reducând time-to-hire de la 48 la 31 de zile prin sourcing activ pe LinkedIn și interviuri structurate.',
          en: 'Closed 42 IT roles in one year, cutting time-to-hire from 48 to 31 days through active LinkedIn sourcing and structured interviews.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă scriu pentru postul de Recrutor din cadrul [Numele companiei]. Am [X] ani de experiență în recrutare end-to-end și mă atrage ritmul de creștere pe care îl are echipa voastră.',
        body: 'La [Compania actuală] am închis 42 de poziții IT într-un an și am redus time-to-hire de la 48 la 31 de zile prin sourcing activ pe LinkedIn și interviuri structurate. Lucrez strâns cu managerii de angajare pentru a defini profilul înainte de a începe căutarea și țin candidații informați pe tot parcursul procesului. Aș aduce aceeași rigoare în echipa [Numele echipei].',
        closing: 'Vă mulțumesc pentru timp. Aș fi bucuros să discutăm într-un interviu despre planul vostru de recrutare.',
      },
      en: {
        intro: 'I am writing to apply for the Recruiter role at [Company Name]. I have [X] years of end-to-end recruiting experience, and the growth pace of your team appeals to me.',
        body: 'At [Current Company], I closed 42 IT roles in one year and cut time-to-hire from 48 to 31 days through active LinkedIn sourcing and structured interviews. I work closely with hiring managers to define the profile before the search starts and keep candidates informed throughout the process. I would bring the same rigor to the [Team Name] team.',
        closing: 'Thank you for your time. I would welcome an interview to discuss your hiring plan.',
      },
    },
  },
  {
    slug: { ro: 'specialist-seo', en: 'seo-specialist' },
    resumeRoleSlug: { ro: 'specialist-seo', en: 'seo-specialist' },
    title: { ro: 'Specialist SEO', en: 'SEO Specialist' },
    category: { ro: 'Marketing', en: 'Marketing' },
    keywords: {
      hardSkills: {
        ro: ['SEO tehnic', 'Cercetare de cuvinte cheie', 'Optimizare on-page', 'Link building', 'Audit SEO', 'Analiza traficului organic'],
        en: ['Technical SEO', 'Keyword research', 'On-page optimization', 'Link building', 'SEO audit', 'Organic traffic analysis'],
      },
      softSkills: {
        ro: ['Gândire analitică', 'Colaborare cu dezvoltatorii și redactorii', 'Răbdare', 'Comunicarea rezultatelor', 'Curiozitate'],
        en: ['Analytical thinking', 'Working with developers and writers', 'Patience', 'Reporting results', 'Curiosity'],
      },
      tools: ['Google Search Console', 'Google Analytics 4', 'Ahrefs', 'Semrush', 'Screaming Frog', 'Looker Studio'],
      certifications: {
        ro: ['Google Analytics Certification', 'Semrush SEO Toolkit Course'],
        en: ['Google Analytics Certification', 'Semrush SEO Toolkit Course'],
      },
    },
    atsChecklist: {
      ro: [
        'Scrie creșterea de trafic organic cu cifre și perioada.',
        'Menționează uneltele cu numele exact (Search Console, Ahrefs, Semrush).',
        'Include dimensiunea site-urilor (număr de pagini) și industria.',
        'Pune rezultatele de business: lead-uri, vânzări, poziții.',
      ],
      en: [
        'State organic traffic growth with figures and the period.',
        'Name the tools exactly (Search Console, Ahrefs, Semrush).',
        'Include the size of the sites (page count) and the industry.',
        'Add business results: leads, sales, rankings.',
      ],
    },
    commonMistakes: {
      ro: [
        'Scrii „am optimizat site-ul” fără trafic, poziții sau conversii.',
        'Lipsesc uneltele și tipul de audit.',
        'Nu spui cum ai lucrat cu dezvoltatorii și redactorii.',
      ],
      en: [
        'Writing "optimized the site" without traffic, rankings or conversions.',
        'Missing the tools and the type of audit.',
        'No mention of how you worked with developers and writers.',
      ],
    },
    bulletExamples: [
      {
        weak: {
          ro: 'Am optimizat site-ul pentru motoarele de căutare.',
          en: 'Optimized the website for search engines.',
        },
        strong: {
          ro: 'Am dublat traficul organic al unui site de e-commerce (de la 18.000 la 37.000 de sesiuni lunare) în 8 luni, prin audit tehnic, restructurarea categoriilor și 40 de articole optimizate.',
          en: 'Doubled an e-commerce site\'s organic traffic (from 18,000 to 37,000 monthly sessions) in 8 months through a technical audit, category restructuring and 40 optimized articles.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă scriu pentru postul de Specialist SEO din cadrul [Numele companiei]. Am [X] ani de experiență în SEO tehnic și de conținut, iar site-ul vostru are potențial clar de creștere organică.',
        body: 'La [Compania actuală] am dublat traficul organic al unui site de e-commerce, de la 18.000 la 37.000 de sesiuni lunare în 8 luni, prin audit tehnic, restructurarea categoriilor și 40 de articole optimizate. Lucrez zilnic în Search Console, Ahrefs și GA4 și raportez rezultatele în termeni de lead-uri și vânzări. Aș începe în echipa [Numele echipei] cu un audit al paginilor cu cel mai mare potențial.',
        closing: 'Vă mulțumesc pentru timp. Aș fi bucuros să discutăm într-un interviu planul vostru de creștere organică.',
      },
      en: {
        intro: 'I am writing to apply for the SEO Specialist role at [Company Name]. I have [X] years of experience in technical and content SEO, and your site has clear organic growth potential.',
        body: 'At [Current Company], I doubled an e-commerce site\'s organic traffic, from 18,000 to 37,000 monthly sessions in 8 months, through a technical audit, category restructuring and 40 optimized articles. I work daily in Search Console, Ahrefs and GA4 and report results in leads and sales. I would start on the [Team Name] team with an audit of the pages that have the most potential.',
        closing: 'Thank you for your time. I would welcome an interview to discuss your organic growth plan.',
      },
    },
  },
  {
    slug: { ro: 'inginer-de-date', en: 'data-engineer' },
    resumeRoleSlug: { ro: 'inginer-de-date', en: 'data-engineer' },
    title: { ro: 'Inginer de Date', en: 'Data Engineer' },
    category: { ro: 'IT & Tehnologie', en: 'IT & Software' },
    keywords: {
      hardSkills: {
        ro: ['Pipeline-uri ETL/ELT', 'Modelarea datelor', 'Data warehouse', 'Procesare în batch și streaming', 'Calitatea datelor', 'Optimizare SQL'],
        en: ['ETL/ELT pipelines', 'Data modeling', 'Data warehousing', 'Batch and streaming processing', 'Data quality', 'SQL optimization'],
      },
      softSkills: {
        ro: ['Colaborare cu analiștii', 'Documentare', 'Rezolvarea problemelor', 'Atenție la detalii', 'Comunicare tehnică'],
        en: ['Working with analysts', 'Documentation', 'Problem solving', 'Attention to detail', 'Technical communication'],
      },
      tools: ['Python', 'SQL', 'Apache Airflow', 'dbt', 'Spark', 'BigQuery', 'Kafka'],
      certifications: {
        ro: ['Google Professional Data Engineer', 'AWS Certified Data Engineer', 'Databricks Data Engineer Associate'],
        en: ['Google Professional Data Engineer', 'AWS Certified Data Engineer', 'Databricks Data Engineer Associate'],
      },
    },
    atsChecklist: {
      ro: [
        'Scrie volumul de date procesat (GB, TB pe zi).',
        'Menționează stack-ul pe fiecare proiect, cu numele exact.',
        'Include timpii și costurile îmbunătățite.',
        'Pune linkul către GitHub dacă ai cod public.',
      ],
      en: [
        'State the data volume processed (GB, TB per day).',
        'Name the stack for each project, spelled exactly.',
        'Include the times and costs you improved.',
        'Add a GitHub link if you have public code.',
      ],
    },
    commonMistakes: {
      ro: [
        'Listezi unelte fără volum și frecvență.',
        'Lipsesc îmbunătățirile de timp sau de cost.',
        'Nu menționezi monitorizarea și calitatea datelor.',
      ],
      en: [
        'Listing tools without volume and frequency.',
        'Missing time or cost improvements.',
        'No mention of monitoring and data quality.',
      ],
    },
    bulletExamples: [
      {
        weak: {
          ro: 'Am construit pipeline-uri de date.',
          en: 'Built data pipelines.',
        },
        strong: {
          ro: 'Am migrat 30 de joburi ETL în Airflow și dbt pe BigQuery, procesând 2 TB pe zi și reducând timpul de încărcare de la 6 ore la 55 de minute.',
          en: 'Migrated 30 ETL jobs to Airflow and dbt on BigQuery, processing 2 TB per day and cutting load time from 6 hours to 55 minutes.',
        },
      },
    ],
    coverLetterSample: {
      ro: {
        intro: 'Vă scriu pentru postul de Inginer de Date din cadrul [Numele companiei]. Am [X] ani de experiență în construirea de pipeline-uri de date cu Python, SQL și Airflow, iar stack-ul vostru se apropie de ce folosesc în prezent.',
        body: 'La [Compania actuală] am migrat 30 de joburi ETL în Airflow și dbt pe BigQuery, procesând 2 TB pe zi și reducând timpul de încărcare de la 6 ore la 55 de minute. Am introdus teste de calitate a datelor care au prins problemele înainte să ajungă în rapoarte. Lucrez în echipă cu analiștii pentru a transforma cererile lor în modele de date clare.',
        closing: 'Vă mulțumesc pentru timp. Aș fi bucuros să discutăm într-un interviu tehnic platforma de date [Numele companiei].',
      },
      en: {
        intro: 'I am writing to apply for the Data Engineer role at [Company Name]. I have [X] years of experience building data pipelines with Python, SQL and Airflow, and your stack is close to what I use today.',
        body: 'At [Current Company], I migrated 30 ETL jobs to Airflow and dbt on BigQuery, processing 2 TB per day and cutting load time from 6 hours to 55 minutes. I added data quality tests that caught problems before they reached reports. I work with analysts to turn their requests into clear data models.',
        closing: 'Thank you for your time. I would welcome a technical interview to discuss the [Company Name] data platform.',
      },
    },
  },
]
