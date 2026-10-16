// Roles 21-30. Same shape as resume-roles.ts. Copy rules: no em dashes, no "X, not Y" phrasing,
// bullet examples are illustrative.
import type { ResumeRole } from './resume-roles'

export const MORE_ROLES: ResumeRole[] = [
  {
    slug: { ro: 'dezvoltator-frontend', en: 'frontend-developer' },
    title: { ro: 'Dezvoltator Frontend', en: 'Frontend Developer' },
    keywords: {
      ro: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'HTML5 și CSS3', 'Tailwind CSS', 'accesibilitate (WCAG)', 'optimizare Core Web Vitals', 'testare (Jest, Playwright)', 'Git', 'design responsive', 'integrare API REST'],
      en: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'HTML5 and CSS3', 'Tailwind CSS', 'accessibility (WCAG)', 'Core Web Vitals optimization', 'testing (Jest, Playwright)', 'Git', 'responsive design', 'REST API integration'],
    },
    commonMistakes: {
      ro: [
        'Listezi framework-uri fără să arăți un proiect public sau un link către cod.',
        'Omiți metricile de performanță: scor Lighthouse, LCP, dimensiunea bundle-ului.',
        'Nu menționezi colaborarea cu designerii și cu echipa de backend.',
      ],
      en: [
        'Listing frameworks without a public project or a link to code.',
        'Leaving out performance metrics: Lighthouse score, LCP, bundle size.',
        'No mention of working with designers and the backend team.',
      ],
    },
    weakBullet: { ro: 'Am lucrat la interfața aplicației web în React.', en: 'Worked on the web application UI in React.' },
    strongBullet: {
      ro: 'Am reconstruit pagina de checkout în React și TypeScript, reducând LCP de la 3,8 s la 1,6 s și crescând rata de finalizare a comenzilor cu 11%.',
      en: 'Rebuilt the checkout page in React and TypeScript, cutting LCP from 3.8s to 1.6s and lifting order completion by 11%.',
    },
  },
  {
    slug: { ro: 'inginer-qa', en: 'qa-engineer' },
    title: { ro: 'Inginer QA', en: 'QA Engineer' },
    keywords: {
      ro: ['testare manuală', 'testare automată', 'Selenium', 'Cypress', 'Playwright', 'Postman', 'planuri de testare', 'raportare bug-uri (Jira)', 'testare de regresie', 'CI/CD', 'testare API', 'metodologii Agile'],
      en: ['manual testing', 'test automation', 'Selenium', 'Cypress', 'Playwright', 'Postman', 'test plans', 'bug reporting (Jira)', 'regression testing', 'CI/CD', 'API testing', 'Agile methodologies'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am testat aplicația” fără tipul de testare, uneltele și acoperirea obținută.',
        'Omiți numărul de teste automatizate și timpul economisit.',
        'Nu menționezi bug-urile critice prinse înainte de lansare.',
      ],
      en: [
        'Writing "tested the application" without the type of testing, the tools and the coverage reached.',
        'Leaving out the number of automated tests and the time saved.',
        'No mention of critical bugs caught before release.',
      ],
    },
    weakBullet: { ro: 'Am testat aplicația și am raportat bug-uri.', en: 'Tested the application and reported bugs.' },
    strongBullet: {
      ro: 'Am automatizat 240 de teste de regresie în Cypress, scurtând ciclul de testare de la 3 zile la 4 ore și prinzând 18 defecte critice înainte de lansare.',
      en: 'Automated 240 regression tests in Cypress, shortening the test cycle from 3 days to 4 hours and catching 18 critical defects before release.',
    },
  },
  {
    slug: { ro: 'specialist-suport-clienti', en: 'customer-support-specialist' },
    title: { ro: 'Specialist Suport Clienți', en: 'Customer Support Specialist' },
    keywords: {
      ro: ['suport clienți', 'comunicare pe chat și e-mail', 'rezolvare tichete', 'Zendesk', 'Freshdesk', 'timp de răspuns', 'CSAT', 'baza de cunoștințe', 'gestionarea reclamațiilor', 'CRM', 'limba engleză', 'empatie'],
      en: ['customer support', 'chat and email communication', 'ticket resolution', 'Zendesk', 'Freshdesk', 'response time', 'CSAT', 'knowledge base', 'complaint handling', 'CRM', 'English language', 'empathy'],
    },
    commonMistakes: {
      ro: [
        'Descrii sarcinile („am răspuns la clienți”) fără volumul de tichete și timpul de rezolvare.',
        'Omiți scorul de satisfacție (CSAT) sau alte metrici de calitate.',
        'Nu menționezi uneltele de ticketing folosite.',
      ],
      en: [
        'Describing tasks ("answered customers") without ticket volume and resolution time.',
        'Leaving out the satisfaction score (CSAT) or other quality metrics.',
        'No mention of the ticketing tools used.',
      ],
    },
    weakBullet: { ro: 'Am răspuns la întrebările clienților prin e-mail și chat.', en: 'Answered customer questions by email and chat.' },
    strongBullet: {
      ro: 'Am gestionat peste 60 de tichete pe zi în Zendesk, cu un CSAT de 96% și un timp mediu de prim răspuns sub 10 minute.',
      en: 'Handled over 60 tickets per day in Zendesk, with a 96% CSAT and an average first response time under 10 minutes.',
    },
  },
  {
    slug: { ro: 'agent-vanzari', en: 'sales-representative' },
    title: { ro: 'Agent de Vânzări', en: 'Sales Representative' },
    keywords: {
      ro: ['vânzări B2B', 'prospectare', 'negociere', 'închiderea vânzărilor', 'CRM (HubSpot, Salesforce)', 'atingerea targetului', 'relații cu clienții', 'prezentări de produs', 'pipeline de vânzări', 'cold calling', 'upselling', 'raportare'],
      en: ['B2B sales', 'prospecting', 'negotiation', 'closing deals', 'CRM (HubSpot, Salesforce)', 'quota attainment', 'client relationships', 'product demos', 'sales pipeline', 'cold calling', 'upselling', 'reporting'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am vândut produse” fără targetul, procentul de realizare sau valoarea vânzărilor.',
        'Omiți dimensiunea portofoliului de clienți și tipul lor.',
        'Nu menționezi CRM-ul folosit și ciclul mediu de vânzare.',
      ],
      en: [
        'Writing "sold products" without the target, attainment percentage or sales value.',
        'Leaving out the size and type of your client portfolio.',
        'No mention of the CRM used and the average sales cycle.',
      ],
    },
    weakBullet: { ro: 'Am vândut produse către clienți noi și existenți.', en: 'Sold products to new and existing clients.' },
    strongBullet: {
      ro: 'Am depășit targetul trimestrial cu 18% (420.000 RON), deschizând 35 de conturi B2B noi prin prospectare directă și urmărire în HubSpot.',
      en: 'Exceeded the quarterly target by 18% (RON 420,000), opening 35 new B2B accounts through direct prospecting and follow-up in HubSpot.',
    },
  },
  {
    slug: { ro: 'recrutor', en: 'recruiter' },
    title: { ro: 'Recrutor', en: 'Recruiter' },
    keywords: {
      ro: ['recrutare end-to-end', 'sourcing', 'interviuri structurate', 'ATS', 'LinkedIn Recruiter', 'employer branding', 'negociere de ofertă', 'time-to-hire', 'relația cu managerii de angajare', 'onboarding', 'evaluarea candidaților', 'GDPR în recrutare'],
      en: ['end-to-end recruiting', 'sourcing', 'structured interviews', 'ATS', 'LinkedIn Recruiter', 'employer branding', 'offer negotiation', 'time-to-hire', 'hiring manager relationships', 'onboarding', 'candidate assessment', 'GDPR in recruiting'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am recrutat angajați” fără numărul de poziții închise și timpul mediu de angajare.',
        'Omiți canalele de sourcing folosite și rata lor de succes.',
        'Nu menționezi ATS-ul și uneltele de recrutare cunoscute.',
      ],
      en: [
        'Writing "recruited employees" without the number of roles closed and the average time to hire.',
        'Leaving out the sourcing channels used and their success rate.',
        'No mention of the ATS and recruiting tools you know.',
      ],
    },
    weakBullet: { ro: 'Am recrutat personal pentru companie.', en: 'Recruited staff for the company.' },
    strongBullet: {
      ro: 'Am închis 42 de poziții IT într-un an, reducând time-to-hire de la 48 la 31 de zile prin sourcing activ pe LinkedIn și interviuri structurate.',
      en: 'Closed 42 IT roles in one year, cutting time-to-hire from 48 to 31 days through active LinkedIn sourcing and structured interviews.',
    },
  },
  {
    slug: { ro: 'specialist-seo', en: 'seo-specialist' },
    title: { ro: 'Specialist SEO', en: 'SEO Specialist' },
    keywords: {
      ro: ['SEO tehnic', 'cercetare de cuvinte cheie', 'optimizare on-page', 'link building', 'Google Search Console', 'Google Analytics 4', 'Ahrefs', 'Semrush', 'audit SEO', 'conținut optimizat', 'Core Web Vitals', 'SEO local'],
      en: ['technical SEO', 'keyword research', 'on-page optimization', 'link building', 'Google Search Console', 'Google Analytics 4', 'Ahrefs', 'Semrush', 'SEO audit', 'optimized content', 'Core Web Vitals', 'local SEO'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am optimizat site-ul pentru Google” fără trafic, poziții sau conversii obținute.',
        'Omiți dimensiunea site-urilor gestionate și industria lor.',
        'Nu menționezi uneltele (Search Console, Ahrefs, Semrush) și tipul de audit realizat.',
      ],
      en: [
        'Writing "optimized the site for Google" without the traffic, rankings or conversions gained.',
        'Leaving out the size of the sites managed and their industry.',
        'No mention of tools (Search Console, Ahrefs, Semrush) and the type of audit performed.',
      ],
    },
    weakBullet: { ro: 'Am optimizat site-ul pentru motoarele de căutare.', en: 'Optimized the website for search engines.' },
    strongBullet: {
      ro: 'Am dublat traficul organic al unui site de e-commerce (de la 18.000 la 37.000 de sesiuni lunare) în 8 luni prin audit tehnic, restructurarea categoriilor și 40 de articole optimizate.',
      en: 'Doubled an e-commerce site\'s organic traffic (from 18,000 to 37,000 monthly sessions) in 8 months through a technical audit, category restructuring and 40 optimized articles.',
    },
  },
  {
    slug: { ro: 'copywriter', en: 'copywriter' },
    title: { ro: 'Copywriter', en: 'Copywriter' },
    keywords: {
      ro: ['copywriting', 'redactare de conținut', 'SEO copywriting', 'ton și voce de brand', 'texte pentru reclame', 'e-mail marketing', 'storytelling', 'editare și corectură', 'cercetare', 'landing pages', 'A/B testing de texte', 'portofoliu'],
      en: ['copywriting', 'content writing', 'SEO copywriting', 'brand voice', 'ad copy', 'email marketing', 'storytelling', 'editing and proofreading', 'research', 'landing pages', 'A/B testing copy', 'portfolio'],
    },
    commonMistakes: {
      ro: [
        'Nu pui link către un portofoliu cu texte publicate.',
        'Descrii „am scris texte” fără rezultate: rată de conversie, deschideri, trafic.',
        'Omiți industriile și formatele în care ai scris.',
      ],
      en: [
        'No link to a portfolio of published work.',
        'Describing "wrote copy" without results: conversion rate, open rate, traffic.',
        'Leaving out the industries and formats you have written for.',
      ],
    },
    weakBullet: { ro: 'Am scris texte pentru site-ul și rețelele sociale ale companiei.', en: 'Wrote copy for the company website and social media.' },
    strongBullet: {
      ro: 'Am rescris o secvență de 5 e-mailuri de bun venit, crescând rata de deschidere de la 24% la 38% și veniturile din secvență cu 27%.',
      en: 'Rewrote a 5-email welcome sequence, lifting the open rate from 24% to 38% and revenue from the sequence by 27%.',
    },
  },
  {
    slug: { ro: 'inginer-de-date', en: 'data-engineer' },
    title: { ro: 'Inginer de Date', en: 'Data Engineer' },
    keywords: {
      ro: ['pipeline-uri de date', 'ETL/ELT', 'SQL', 'Python', 'Apache Spark', 'Airflow', 'data warehouse', 'dbt', 'Kafka', 'cloud (AWS, GCP, Azure)', 'modelarea datelor', 'calitatea datelor'],
      en: ['data pipelines', 'ETL/ELT', 'SQL', 'Python', 'Apache Spark', 'Airflow', 'data warehouse', 'dbt', 'Kafka', 'cloud (AWS, GCP, Azure)', 'data modeling', 'data quality'],
    },
    commonMistakes: {
      ro: [
        'Listezi unelte fără volumul de date procesat și frecvența pipeline-urilor.',
        'Omiți costurile sau timpii de procesare îmbunătățiți.',
        'Nu menționezi monitorizarea și calitatea datelor.',
      ],
      en: [
        'Listing tools without the data volume processed and the pipeline frequency.',
        'Leaving out the cost or processing time you improved.',
        'No mention of monitoring and data quality.',
      ],
    },
    weakBullet: { ro: 'Am construit pipeline-uri de date pentru echipa de analiză.', en: 'Built data pipelines for the analytics team.' },
    strongBullet: {
      ro: 'Am migrat 30 de joburi ETL în Airflow și dbt pe BigQuery, procesând 2 TB pe zi și reducând timpul de încărcare de la 6 ore la 55 de minute.',
      en: 'Migrated 30 ETL jobs to Airflow and dbt on BigQuery, processing 2 TB per day and cutting load time from 6 hours to 55 minutes.',
    },
  },
  {
    slug: { ro: 'specialist-logistica', en: 'logistics-specialist' },
    title: { ro: 'Specialist Logistică', en: 'Logistics Specialist' },
    keywords: {
      ro: ['logistică și transport', 'managementul stocurilor', 'planificarea livrărilor', 'depozitare', 'ERP (SAP)', 'documente de transport (CMR)', 'optimizarea costurilor', 'relația cu transportatorii', 'import-export', 'KPI logistici', 'WMS', 'Excel avansat'],
      en: ['logistics and transport', 'inventory management', 'delivery planning', 'warehousing', 'ERP (SAP)', 'transport documents (CMR)', 'cost optimization', 'carrier relationships', 'import-export', 'logistics KPIs', 'WMS', 'advanced Excel'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am coordonat transporturi” fără numărul de livrări, regiunile și rata de livrare la timp.',
        'Omiți costurile reduse sau stocurile optimizate.',
        'Nu menționezi sistemul ERP/WMS folosit.',
      ],
      en: [
        'Writing "coordinated shipments" without the number of deliveries, regions and on-time rate.',
        'Leaving out the costs reduced or the stock optimized.',
        'No mention of the ERP/WMS used.',
      ],
    },
    weakBullet: { ro: 'Am coordonat transporturile și stocurile companiei.', en: 'Coordinated the company\'s shipments and stock.' },
    strongBullet: {
      ro: 'Am planificat peste 300 de livrări lunare în 12 țări din SAP, crescând rata de livrare la timp de la 89% la 96% și reducând costul de transport cu 9%.',
      en: 'Planned over 300 monthly deliveries across 12 countries in SAP, raising the on-time rate from 89% to 96% and cutting transport cost by 9%.',
    },
  },
  {
    slug: { ro: 'receptioner', en: 'receptionist' },
    title: { ro: 'Recepționer', en: 'Receptionist' },
    keywords: {
      ro: ['primirea vizitatorilor', 'gestionarea apelurilor', 'programări și calendare', 'comunicare profesională', 'Microsoft Office', 'relații cu clienții', 'corespondență', 'organizare', 'limba engleză', 'discreție', 'sisteme de rezervări', 'multitasking'],
      en: ['visitor reception', 'call handling', 'scheduling and calendars', 'professional communication', 'Microsoft Office', 'customer relations', 'correspondence', 'organization', 'English language', 'discretion', 'booking systems', 'multitasking'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am primit vizitatori” fără volumul zilnic și responsabilitățile suplimentare.',
        'Omiți sistemele de rezervări și programele folosite.',
        'Nu menționezi limbile străine vorbite, cu nivelul scris în cuvinte.',
      ],
      en: [
        'Writing "greeted visitors" without the daily volume and added responsibilities.',
        'Leaving out the booking systems and software used.',
        'No mention of foreign languages spoken, with the level written in words.',
      ],
    },
    weakBullet: { ro: 'Am primit vizitatori și am răspuns la telefon.', en: 'Greeted visitors and answered the phone.' },
    strongBullet: {
      ro: 'Am gestionat recepția unui birou cu 120 de angajați, peste 40 de vizitatori și 80 de apeluri pe zi, și am introdus un sistem de programare a sălilor care a eliminat suprapunerile de întâlniri.',
      en: 'Ran reception for a 120-person office, handling over 40 visitors and 80 calls a day, and introduced a room-booking system that removed meeting overlaps.',
    },
  },
]
