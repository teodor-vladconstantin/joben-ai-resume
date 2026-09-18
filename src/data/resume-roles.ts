import type { AppLocale } from '@/i18n/routing'

export type LocalizedText = { ro: string; en: string }
export type LocalizedList = { ro: string[]; en: string[] }

export type ResumeRole = {
  slug: LocalizedText
  title: LocalizedText
  keywords: LocalizedList
  commonMistakes: LocalizedList
  weakBullet: LocalizedText
  strongBullet: LocalizedText
}

// Test set - 13 roles to validate design/copy quality before scaling to the
// full 30+ role catalog. Add more entries here once approved; the route at
// src/app/[locale]/resume-examples/[slug]/page.tsx and the sitemap both
// derive their pages from this file automatically, per locale.
export const resumeRoles: ResumeRole[] = [
  {
    slug: { ro: 'analist-date', en: 'data-analyst' },
    title: { ro: 'Analist de Date', en: 'Data Analyst' },
    keywords: {
      ro: ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI', 'vizualizare de date', 'testare A/B', 'ETL', 'analiză statistică', 'raportare dashboard', 'curățare de date', 'comunicare cu stakeholderii'],
      en: ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI', 'data visualization', 'A/B testing', 'ETL', 'statistical analysis', 'dashboard reporting', 'data cleaning', 'stakeholder communication'],
    },
    commonMistakes: {
      ro: [
        'Scrii "am analizat date" fără să numești uneltele, seturile de date sau deciziile de business generate de analiză.',
        'Omiți volumul datelor cu care ai lucrat: număr de rânduri, surse de date, frecvența actualizării.',
        'Nu menționezi cum ai comunicat concluziile către persoane non-tehnice.',
        'Confunzi raportarea (construirea de dashboard-uri) cu analiza (extragerea de insight-uri). CV-urile care arată doar prima parte par de nivel junior.',
      ],
      en: [
        'Listing "analyzed data" without naming the tools, datasets, or business decisions the analysis drove.',
        'Omitting the scale of data worked with: row counts, data sources, refresh frequency.',
        'No mention of how findings were communicated to non-technical stakeholders.',
        'Confusing reporting (building dashboards) with analysis (deriving insights). Resumes that only show the former read as junior.',
      ],
    },
    weakBullet: { ro: 'Am analizat date de vânzări și am creat rapoarte pentru management.', en: 'Analyzed sales data and created reports for management.' },
    strongBullet: {
      ro: 'Am construit un dashboard Tableau care urmărea vânzările săptămânale în 12 regiuni, identificând o subperformanță de 15% într-o regiune, ceea ce a dus la o promoție țintită care a crescut veniturile trimestriale cu 340.000 $.',
      en: 'Built a Tableau dashboard tracking weekly sales across 12 regions, surfacing a 15% underperformance in the Midwest that led to a targeted promotion increasing quarterly revenue by $340K.',
    },
  },
  {
    slug: { ro: 'manager-marketing', en: 'marketing-manager' },
    title: { ro: 'Manager de Marketing', en: 'Marketing Manager' },
    keywords: {
      ro: ['gestionare campanii', 'SEO/SEM', 'automatizare marketing', 'HubSpot', 'Google Analytics', 'gestionare buget', 'strategie de brand', 'generare de lead-uri', 'optimizarea ratei de conversie', 'strategie de conținut', 'leadership cross-funcțional', 'testare A/B'],
      en: ['campaign management', 'SEO/SEM', 'marketing automation', 'HubSpot', 'Google Analytics', 'budget management', 'brand strategy', 'lead generation', 'conversion rate optimization', 'content strategy', 'cross-functional leadership', 'A/B testing'],
    },
    commonMistakes: {
      ro: [
        'Descrii campaniile derulate fără nicio metrică de performanță: reach, CTR, conversie, ROI.',
        'Nu menționezi mărimea bugetului gestionat, primul lucru urmărit de angajatori la nivel de manager.',
        'Listezi canale ("am gestionat social media") în loc de rezultate ("am triplat urmăritorii organici").',
        'Lipsește conducerea echipei sau a furnizorilor. La nivel de manager se așteaptă management de oameni, nu doar execuție.',
      ],
      en: [
        'Describing campaigns run without any performance metric: reach, CTR, conversion, ROI.',
        'No mention of budget size managed, which is the first thing hiring managers scan for at the Manager level.',
        'Listing channels ("ran social media") instead of outcomes ("grew organic social following 3x").',
        'Missing team or vendor leadership. Manager-level roles are expected to show people management, not just execution.',
      ],
    },
    weakBullet: { ro: 'Am gestionat conturile de social media și campaniile de email ale companiei.', en: 'Managed social media accounts and email campaigns for the company.' },
    strongBullet: {
      ro: 'Am condus o echipă de marketing de 4 persoane și un buget anual de 180.000 $; am crescut lead-urile calificate cu 42% an-la-an prin redirecționarea bugetului din social plătit către conținut SEO, reducând costul per lead cu 28%.',
      en: 'Led a 4-person marketing team and $180K annual budget; grew qualified leads 42% YoY by shifting spend from paid social to SEO-driven content, cutting cost-per-lead by 28%.',
    },
  },
  {
    slug: { ro: 'inginer-software', en: 'software-engineer' },
    title: { ro: 'Inginer Software', en: 'Software Engineer' },
    keywords: {
      ro: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'REST API', 'CI/CD', 'testare unitară', 'design de sisteme', 'infrastructură cloud (AWS/GCP)', 'Git', 'agile/scrum', 'code review'],
      en: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'REST APIs', 'CI/CD', 'unit testing', 'system design', 'cloud infrastructure (AWS/GCP)', 'Git', 'agile/scrum', 'code review'],
    },
    commonMistakes: {
      ro: [
        'Listezi fiecare limbaj sau framework atins vreodată, în loc de cele 5-8 care se potrivesc cu fișa postului.',
        'Descrii responsabilități ("am lucrat la servicii backend") în loc de impact: latență, uptime, scală, cost.',
        'Nu menționezi mărimea echipei, scala codebase-ului sau impactul asupra utilizatorilor, ceea ce face imposibilă evaluarea senioratului.',
        'Lipsesc dovezi de ownership: funcționalități livrate, ture de on-call, mentorat sau decizii de arhitectură.',
      ],
      en: [
        'Listing every language or framework ever touched instead of the 5-8 that match the job description.',
        'Describing responsibilities ("worked on backend services") instead of impact: latency, uptime, scale, cost.',
        'No mention of team size, codebase scale, or user-facing impact, which makes seniority impossible to judge.',
        'Missing evidence of ownership: shipped features, on-call rotation, mentoring, or architecture decisions.',
      ],
    },
    weakBullet: { ro: 'Am lucrat la funcționalități backend cu Node.js și am îmbunătățit API-ul.', en: 'Worked on backend features using Node.js and improved the API.' },
    strongBullet: {
      ro: 'Am redesenat interogările bazei de date pentru API-ul de checkout și am adăugat caching cu Redis, reducând latența p95 de la 800ms la 140ms și scăzând tichetele de suport cauzate de timeout cu 90%.',
      en: "Redesigned the checkout API's database queries and added Redis caching, cutting p95 latency from 800ms to 140ms and reducing timeout-related support tickets by 90%.",
    },
  },
  {
    slug: { ro: 'manager-de-produs', en: 'product-manager' },
    title: { ro: 'Manager de Produs', en: 'Product Manager' },
    keywords: {
      ro: ['roadmap de produs', 'cercetare utilizatori', 'testare A/B', 'management stakeholderi', 'agile/scrum', 'strategie go-to-market', 'framework-uri de prioritizare', 'decizii bazate pe date', 'leadership cross-funcțional', 'ownership KPI/OKR', 'customer discovery', 'wireframing'],
      en: ['product roadmap', 'user research', 'A/B testing', 'stakeholder management', 'agile/scrum', 'go-to-market strategy', 'prioritization frameworks', 'data-driven decision making', 'cross-functional leadership', 'KPI/OKR ownership', 'customer discovery', 'wireframing'],
    },
    commonMistakes: {
      ro: [
        'Descrii ce a livrat echipa fără să spui rezultatul de business pe care funcționalitatea trebuia să-l genereze.',
        'Nu ai metrici legate de ownership-ul produsului: rata de adopție, creșterea retenției, impact asupra veniturilor, NPS.',
        'Listezi "am lucrat cu engineering și design" ca realizare, în loc de ce a produs acea colaborare.',
        'Lipsesc dovezi de prioritizare. CV-urile de PM trebuie să arate decizii de compromis, nu doar livrare de funcționalități.',
      ],
      en: [
        'Describing what the team shipped without stating the business outcome the feature was meant to drive.',
        'No metrics tied to product ownership: adoption rate, retention lift, revenue impact, NPS.',
        'Listing "worked with engineering and design" as an accomplishment instead of what that collaboration produced.',
        'Missing evidence of prioritization. PM resumes should show trade-off decisions, not just feature delivery.',
      ],
    },
    weakBullet: { ro: 'Am lucrat cu echipele de engineering și design pentru a lansa funcționalități noi.', en: 'Worked with engineering and design teams to launch new features.' },
    strongBullet: {
      ro: 'Am condus end-to-end redesign-ul fluxului de onboarding; am realizat 15 interviuri cu utilizatorii pentru a identifica punctele de abandon, apoi am livrat un flux în 3 pași care a crescut rata de activare de la 48% la 67% într-un trimestru.',
      en: 'Owned the onboarding flow redesign end-to-end; ran 15 user interviews to identify drop-off points, then shipped a 3-step flow that lifted activation rate from 48% to 67% within one quarter.',
    },
  },
  {
    slug: { ro: 'designer-ux', en: 'ux-designer' },
    title: { ro: 'Designer UX', en: 'UX Designer' },
    keywords: {
      ro: ['cercetare utilizatori', 'wireframing', 'prototipare', 'Figma', 'testare de utilizabilitate', 'design systems', 'arhitectura informației', 'design de interacțiune', 'accesibilitate (WCAG)', 'persona utilizator', 'testare A/B', 'colaborare cross-funcțională'],
      en: ['user research', 'wireframing', 'prototyping', 'Figma', 'usability testing', 'design systems', 'information architecture', 'interaction design', 'accessibility (WCAG)', 'user personas', 'A/B testing', 'cross-functional collaboration'],
    },
    commonMistakes: {
      ro: [
        'Pui un link către portofoliu fără să descrii niciun proiect în CV. Recrutorii citesc rapid CV-ul mai întâi.',
        'Pui uneltele (Figma, Sketch) pe primul loc, în loc de procesul de design și rezultate.',
        'Nu menționezi metodele de cercetare folosite pentru validarea deciziilor de design; pare doar design vizual.',
        'Lipsește impactul măsurabil: rata de finalizare a task-urilor, timp per task, conversie, conformitate de accesibilitate.',
      ],
      en: [
        'Linking to a portfolio without describing any project in the resume itself. Recruiters skim the resume first.',
        'Listing tools (Figma, Sketch) as the headline instead of the design process and outcomes.',
        'No mention of the research methods used to validate design decisions; reads as visual design only.',
        'Missing measurable impact: task completion rate, time-on-task, conversion, accessibility compliance.',
      ],
    },
    weakBullet: { ro: 'Am proiectat interfețe pentru aplicația mobilă folosind Figma.', en: 'Designed user interfaces for the mobile app using Figma.' },
    strongBullet: {
      ro: 'Am redesenat fluxul de checkout mobil pe baza a 20 de sesiuni de testare a utilizabilității, reducând timpul de finalizare a task-ului cu 35% și abandonul coșului cu 18% post-lansare.',
      en: 'Redesigned the mobile checkout flow based on 20 usability test sessions, reducing task completion time by 35% and cart abandonment by 18% post-launch.',
    },
  },
  {
    slug: { ro: 'profesor', en: 'teacher' },
    title: { ro: 'Profesor', en: 'Teacher' },
    keywords: {
      ro: ['dezvoltare curriculă', 'managementul clasei', 'instruire diferențiată', 'planificarea lecțiilor', 'conformitate CES', 'evaluarea elevilor', 'Google Classroom', 'comunicare cu părinții', 'aliniere la programa națională', 'managementul comportamentului', 'dezvoltare profesională', 'sprijin pentru educație specială'],
      en: ['curriculum development', 'classroom management', 'differentiated instruction', 'lesson planning', 'IEP/504 compliance', 'student assessment', 'Google Classroom', 'parent-teacher communication', 'state standards alignment', 'behavior management', 'professional development', 'special education support'],
    },
    commonMistakes: {
      ro: [
        'Listezi sarcini ("am predat matematică la clasa a V-a") fără rezultate ale elevilor: creșteri la teste, progres la citire, rate de promovare.',
        'Omiți detalii despre mărimea clasei și profilul elevilor (elevi cu CES, elevi vorbitori non-nativi de română) pe care comisiile de angajare le folosesc pentru a evalua experiența relevantă.',
        'Nu menționezi alinierea la programa națională, un termen specific pe care ATS-urile îl caută în anunțurile din educație.',
        'Tratezi implicarea părinților și a comunității ca o notă de subsol, deși multe școli o caută ca și competență de bază.',
      ],
      en: [
        'Listing duties ("taught 5th grade math") without student outcomes: test score gains, reading level growth, pass rates.',
        'Omitting class size and student population details (Title I, ELL, special education inclusion) that hiring committees use to judge relevant experience.',
        'No mention of standards alignment (Common Core, state frameworks), a specific term ATS screens for in education postings.',
        'Treating parent and community engagement as a footnote when many districts screen for it as a core competency.',
      ],
    },
    weakBullet: { ro: 'Am predat la clasa a IV-a și am corectat teme.', en: 'Taught 4th grade classes and graded assignments.' },
    strongBullet: {
      ro: 'Am predat matematică și citire la clasa a IV-a unei clase de 26 de elevi, dintre care 6 cu CES; am crescut media rezultatelor la evaluarea națională de la 62% la 81% grad de competență într-un an școlar.',
      en: 'Taught 4th grade math and reading to a class of 26 students, including 6 IEP students; raised average state assessment scores from 62% to 81% proficient over one school year.',
    },
  },
  {
    slug: { ro: 'manager-de-proiect', en: 'project-manager' },
    title: { ro: 'Manager de Proiect', en: 'Project Manager' },
    keywords: {
      ro: ['planificarea proiectelor', 'managementul riscului', 'Agile/Waterfall', 'Jira', 'MS Project', 'control buget și costuri', 'raportare către stakeholderi', 'managementul scopului', 'coordonare cross-funcțională', 'metodologie PMP', 'managementul furnizorilor', 'managementul schimbării'],
      en: ['project scheduling', 'risk management', 'Agile/Waterfall', 'Jira', 'MS Project', 'budget and cost control', 'stakeholder reporting', 'scope management', 'cross-functional coordination', 'PMP methodology', 'vendor management', 'change management'],
    },
    commonMistakes: {
      ro: [
        'Listezi certificări (PMP, CAPM) fără dovezi că le-ai aplicat: proiecte livrate la timp, în buget, în scop.',
        'Nu menționezi mărimea proiectului (buget, echipă, durată), primul filtru aplicat de majoritatea angajatorilor.',
        'Confunzi "am coordonat" cu "am gestionat". CV-urile trebuie să arate ownership pe planificare, buget și risc, nu doar facilitarea ședințelor.',
        'Lipsește o metrică agregată de livrare (rată de livrare la timp, abatere de buget) pe mai multe proiecte, ceea ce diferențiază un CV de PM de unul de coordonator.',
      ],
      en: [
        'Listing certifications (PMP, CAPM) without evidence of applying them: projects actually delivered on time, on budget, in scope.',
        'No mention of project size (budget, team headcount, duration), the first filter most hiring managers apply.',
        'Confusing "coordinated" with "managed." Resumes should show ownership of schedule, budget, and risk, not just meeting facilitation.',
        'Missing an aggregate delivery metric (on-time rate, budget variance) across multiple projects, which is what separates PM resumes from coordinator resumes.',
      ],
    },
    weakBullet: { ro: 'Am coordonat ședințe între echipe și am urmărit termenele proiectului.', en: 'Coordinated meetings between teams and tracked project timelines.' },
    strongBullet: {
      ro: 'Am gestionat o migrare ERP de 2,1 milioane $ în 6 departamente și cu 40 de stakeholderi, livrând cu 3 săptămâni mai devreme și 8% sub buget prin renegocierea a două contracte cu furnizori.',
      en: 'Managed a $2.1M ERP migration across 6 departments and 40 stakeholders, delivering 3 weeks ahead of schedule and 8% under budget by renegotiating two vendor contracts.',
    },
  },
  {
    slug: { ro: 'analist-business', en: 'business-analyst' },
    title: { ro: 'Analist Business', en: 'Business Analyst' },
    keywords: {
      ro: ['colectare cerințe', 'maparea proceselor', 'SQL', 'interviuri cu stakeholderi', 'analiză de gap', 'îmbunătățirea proceselor de business', 'modelare de date', 'user stories', 'JIRA/Confluence', 'UAT (testare de acceptanță)', 'documentație BRD/FRD', 'analiză cost-beneficiu'],
      en: ['requirements gathering', 'process mapping', 'SQL', 'stakeholder interviews', 'gap analysis', 'business process improvement', 'data modeling', 'user stories', 'JIRA/Confluence', 'UAT (user acceptance testing)', 'BRD/FRD documentation', 'cost-benefit analysis'],
    },
    commonMistakes: {
      ro: [
        'Descrii ședințele la care ai participat ("am colectat cerințe de la stakeholderi") în loc de ce a rezultat din ele: un BRD, un proces redesenat, o specificație de sistem.',
        'Nu cuantifici îmbunătățirea proceselor: timp de ciclu redus, rată de eroare scăzută, pași manuali eliminați.',
        'Amesteci atribuțiile cu cele de Project Manager. Un CV de BA trebuie să arate analiză și documentare, nu doar coordonare.',
        'Lipsesc dovezi de fluență tehnică (interogări SQL scrise, modele de date construite) când rolul vizat e de BA tehnic, nu doar orientat pe procese.',
      ],
      en: [
        'Describing meetings attended ("gathered requirements from stakeholders") instead of what was delivered from them: a BRD, a redesigned process, a system spec.',
        'No quantified process improvement: cycle time reduced, error rate cut, manual steps eliminated.',
        'Blurring the line with Project Manager duties. A BA resume should show analysis and documentation, not just coordination.',
        'Missing evidence of technical fluency (SQL queries written, data models built) when the target role is a technical BA, not a purely process-focused one.',
      ],
    },
    weakBullet: { ro: 'Am colectat cerințe de la stakeholderi și am documentat procesele de business.', en: 'Gathered requirements from stakeholders and documented business processes.' },
    strongBullet: {
      ro: 'Am realizat o analiză de gap pe fluxul de procesare a comenzilor, identificând 4 pași de aprobare redundanți; redesign-ul rezultat a redus timpul mediu de procesare a unei comenzi de la 3,2 zile la 1,1 zile.',
      en: 'Ran a gap analysis across the order-fulfillment workflow, identifying 4 redundant approval steps; the resulting process redesign cut average order processing time from 3.2 days to 1.1 days.',
    },
  },
  {
    slug: { ro: 'manager-vanzari', en: 'sales-manager' },
    title: { ro: 'Manager de Vânzări', en: 'Sales Manager' },
    keywords: {
      ro: ['atingerea cotei', 'gestionarea pipeline-ului', 'CRM (Salesforce)', 'gestionarea teritoriului', 'prognoza vânzărilor', 'coaching de echipă', 'vânzări B2B/B2C', 'gestionarea conturilor cheie', 'sales enablement', 'negociere', 'creșterea veniturilor', 'optimizarea ciclului de vânzare'],
      en: ['quota attainment', 'pipeline management', 'CRM (Salesforce)', 'territory management', 'sales forecasting', 'team coaching', 'B2B/B2C sales', 'key account management', 'sales enablement', 'negotiation', 'revenue growth', 'sales cycle optimization'],
    },
    commonMistakes: {
      ro: [
        'Nu menționezi atingerea cotei în procente: e cea mai căutată metrică pentru acest rol, iar absența ei sugerează performanță slabă.',
        'Scrii "am gestionat o echipă de vânzări" fără mărimea echipei, teritoriul sau veniturile gestionate.',
        'Nu faci distincție între rezultatele individuale de vânzări și cele ale echipei după promovarea în management.',
        'Lipsește metodologia de vânzări sau fluența CRM (Salesforce, HubSpot) pe care sistemele ATS le filtrează specific la acest nivel.',
      ],
      en: [
        "Not stating quota attainment as a percentage: it's the single most-scanned metric for this role, and its absence reads as underperformance.",
        'Listing "managed a sales team" without team size, territory, or revenue owned.',
        'No distinction between individual-contributor sales numbers and team-wide results after promotion into management.',
        'Missing sales methodology or CRM fluency (Salesforce, HubSpot) that ATS systems specifically filter for at this level.',
      ],
    },
    weakBullet: { ro: 'Am gestionat o echipă de vânzări și am contribuit la creșterea veniturilor.', en: 'Managed a sales team and helped increase revenue.' },
    strongBullet: {
      ro: 'Am condus o echipă de vânzări B2B de 7 oameni la 118% dintr-o cotă anuală de 4,2 milioane $, reconstruind programul de onboarding, ceea ce a redus timpul de acomodare al unui vânzător nou de la 5 luni la 10 săptămâni.',
      en: 'Led a 7-rep B2B sales team to 118% of a $4.2M annual quota, rebuilding the onboarding program that cut new-rep ramp time from 5 months to 10 weeks.',
    },
  },
  {
    slug: { ro: 'contabil', en: 'accountant' },
    title: { ro: 'Contabil', en: 'Accountant' },
    keywords: {
      ro: ['GAAP', 'furnizori/clienți (AP/AR)', 'registru general', 'raportare financiară', 'reconcilierea conturilor', 'QuickBooks/SAP', 'închidere de lună', 'analiza abaterilor de buget', 'pregătirea declarațiilor fiscale', 'suport pentru audit', 'provizioane', 'Excel (tabele pivot, VLOOKUP)'],
      en: ['GAAP', 'accounts payable/receivable', 'general ledger', 'financial reporting', 'account reconciliation', 'QuickBooks/SAP', 'month-end close', 'budget variance analysis', 'tax preparation', 'audit support', 'accruals', 'Excel (pivot tables, VLOOKUP)'],
    },
    commonMistakes: {
      ro: [
        'Scrii "responsabil de contabilitate" fără să menționezi durata ciclului de închidere, volumul de tranzacții sau sistemele folosite.',
        'Nu menționezi rezultate de acuratețe sau conformitate: audituri curate, reconcilieri fără erori, termene respectate constant.',
        'Omiți programul de contabilitate sau ERP-ul folosit efectiv (QuickBooks, SAP, NetSuite), un filtru dur în multe ATS-uri pentru acest rol.',
        'Limbaj vag ca "am ajutat la închiderea de lună" în loc să spui exact ce părți ai gestionat: provizioane, reconcilieri, raportare.',
      ],
      en: [
        'Listing "responsible for bookkeeping" without naming the close cycle time, transaction volume, or systems used.',
        'No mention of accuracy or compliance outcomes: clean audits, error-free reconciliations, deadlines consistently met.',
        'Omitting the accounting software or ERP actually used (QuickBooks, SAP, NetSuite), a hard filter in many ATS screens for this role.',
        'Vague language like "assisted with month-end close" instead of stating which parts were owned: accruals, reconciliations, reporting.',
      ],
    },
    weakBullet: { ro: 'Responsabil de plăți către furnizori și sarcini de închidere de lună.', en: 'Responsible for accounts payable and month-end closing tasks.' },
    strongBullet: {
      ro: 'Am gestionat integral plățile către furnizori pentru 3 unități de business (~1,8 milioane $/lună), închizând contabilitatea cu 2 zile lucrătoare mai repede după automatizarea reconcilierii furnizorilor în QuickBooks.',
      en: 'Owned full-cycle accounts payable for 3 business units (~$1.8M/month), closing the books 2 business days faster after automating vendor reconciliation in QuickBooks.',
    },
  },
  {
    slug: { ro: 'nivel-incepator', en: 'entry-level' },
    title: { ro: 'Nivel Începător', en: 'Entry-Level' },
    keywords: {
      ro: ['cursuri relevante', 'proiecte academice', 'experiență de internship', 'competențe transferabile', 'leadership (cluburi/organizații)', 'Microsoft Office/Google Workspace', 'rezolvare de probleme', 'colaborare în echipă', 'gestionarea timpului', 'învățare rapidă', 'experiență de voluntariat', 'medie (dacă e peste 8.50)'],
      en: ['relevant coursework', 'academic projects', 'internship experience', 'transferable skills', 'leadership (clubs/organizations)', 'Microsoft Office/Google Workspace', 'problem-solving', 'team collaboration', 'time management', 'quick learner', 'volunteer experience', 'GPA (if 3.5 or higher)'],
    },
    commonMistakes: {
      ro: [
        'Îți ceri scuze pentru lipsa de experiență într-un obiectiv de carieră, în loc să pui în față ce ai: cursuri, proiecte, internship-uri.',
        'Listezi sarcini dintr-un job part-time fără legătură, fără să le traduci în competențe transferabile (relații cu clienții devine comunicare, gestionarea banilor devine atenție la detalii).',
        'Tratezi secțiunea de educație ca pe o completare. La nivel de începător trebuie detaliată: cursuri relevante, medie dacă e bună, mențiuni, proiecte de final de studii.',
        'Lași munca academică și de proiect necuantificată (mărimea echipei, amploarea proiectului, rezultate); chiar și munca neplătită poate și trebuie să arate un rezultat măsurabil.',
      ],
      en: [
        'Apologizing for a lack of experience in an objective statement instead of leading with what you do have: coursework, projects, internships.',
        'Listing duties from unrelated part-time work without translating them into transferable skills (customer service becomes communication, cash handling becomes attention to detail).',
        'Treating the education section as an afterthought. At entry level it should be detailed: relevant coursework, GPA if strong, honors, capstone projects.',
        'Leaving academic and project work unquantified (team size, project scope, results); even unpaid work can and should show a measurable outcome.',
      ],
    },
    weakBullet: { ro: 'Am urmat cursuri de marketing și am lucrat part-time ca și casier.', en: 'Completed coursework in marketing and worked part-time as a cashier.' },
    strongBullet: {
      ro: 'Am condus o echipă de 4 persoane într-un proiect de marketing de final de studii care a crescut urmăritorii unui brand fictiv de la 0 la 1.200 în 8 săptămâni, prezentând rezultatele unui panel de profesioniști din industrie.',
      en: "Led a 4-person team in a capstone marketing project that grew a mock brand's social following from 0 to 1,200 followers in 8 weeks, presenting results to a panel of industry professionals.",
    },
  },
  {
    slug: { ro: 'stagiu', en: 'internship' },
    title: { ro: 'Internship', en: 'Internship' },
    keywords: {
      ro: ['caut internship', 'cursuri relevante', 'implicare în viața de campus', 'proiecte academice', 'lucru în echipă colaborativ', 'Microsoft Excel/PowerPoint', 'abilități de comunicare', 'adaptabilitate', 'experiență de cercetare', 'disponibilitate/durată', 'competențe tehnice (uneltele specifice)', 'mențiuni academice'],
      en: ['seeking internship', 'relevant coursework', 'campus involvement', 'academic projects', 'collaborative teamwork', 'Microsoft Excel/PowerPoint', 'communication skills', 'adaptability', 'research experience', 'availability/duration', 'technical skills (list specific tools)', 'academic honors'],
    },
    commonMistakes: {
      ro: [
        'Faci CV-ul să sune ca o foaie matricolă. Listezi fiecare curs în loc de cele 3-4 cele mai relevante pentru domeniul internship-ului.',
        'Omiți detalii de disponibilitate (dată de start, durată, ore pe săptămână); multe filtre ATS pentru internship-uri caută exact asta.',
        'Subestimezi proiectele de curs și munca în echipă descriindu-le vag, în loc să numești uneltele, rolul și rezultatul.',
        'Omiți complet o secțiune de competențe. Pentru studenți cu istoric de muncă limitat, o listă clară de competențe e adesea cea mai rapidă cale de a trece de scanarea ATS.',
      ],
      en: [
        "Making the resume read like a class transcript. Listing every course taken instead of the 3-4 most relevant to the internship's field.",
        'Leaving out availability details (start date, duration, hours per week); many internship ATS filters screen on this directly.',
        'Underselling class projects and group work by describing them vaguely instead of naming the tools, role, and outcome.',
        'Skipping a skills section entirely. For students with limited work history, a clear skills list is often the fastest way to pass an ATS keyword scan.',
      ],
    },
    weakBullet: { ro: 'Am lucrat la un proiect de grup pentru un curs de business și am susținut o prezentare.', en: 'Worked on a group project for a business class and gave a presentation.' },
    strongBullet: {
      ro: 'Am construit un model financiar în Excel pentru un proiect de consultanță de un semestru cu o organizație non-profit locală, prezentând 3 recomandări de reducere a costurilor pe care clientul le-a adoptat, economisind estimativ 8.000 $ anual.',
      en: 'Built a financial model in Excel for a semester-long consulting project with a local nonprofit, presenting 3 cost-saving recommendations that the client adopted, saving an estimated $8,000 annually.',
    },
  },
  {
    slug: { ro: 'asistent-medical', en: 'registered-nurse' },
    title: { ro: 'Asistent Medical', en: 'Registered Nurse' },
    keywords: {
      ro: ['evaluarea pacientului', 'EHR/EMR (Epic, Cerner)', 'administrarea medicației', 'plan de îngrijire', 'conformitate HIPAA', 'certificare BLS/ACLS', 'educarea pacientului', 'colaborare interdisciplinară', 'triaj', 'protocoale de control al infecțiilor', 'documentație clinică', 'susținerea pacientului'],
      en: ['patient assessment', 'EHR/EMR (Epic, Cerner)', 'medication administration', 'care plan development', 'HIPAA compliance', 'BLS/ACLS certification', 'patient education', 'interdisciplinary collaboration', 'triage', 'infection control protocols', 'clinical documentation', 'patient advocacy'],
    },
    commonMistakes: {
      ro: [
        'Scrii "am oferit îngrijire pacienților" fără tipul de secție sau specialitatea (ATI, UPU, Medicină Internă) pe care angajatorii le filtrează primele.',
        'Omiți certificările și valabilitatea lor (BLS, ACLS, PALS), un filtru comun în ATS-urile din medicină; o dată de expirare neclară e semnal de alarmă.',
        'Nu menționezi numărul de pacienți sau raportul asistent-pacient. E semnalul de scală pe care recrutorii îl folosesc pentru a evalua complexitatea secției și nivelul de experiență.',
        'Descrii sarcini fără rezultate de siguranță sau calitate (căderi prevenite, rate de infecție, scoruri de satisfacție a pacienților). Punctele bazate doar pe sarcini par junior indiferent de vechime.',
      ],
      en: [
        'Listing "provided patient care" without the unit type or specialty (ICU, ER, Med-Surg) that hiring managers filter on first.',
        'Omitting certifications and their currency (BLS, ACLS, PALS), a common hard filter in nursing ATS screens; an unclear expiration date also reads as a red flag.',
        'No mention of patient load or nurse-to-patient ratio. This is the scale signal recruiters use to judge unit acuity and experience level.',
        'Describing tasks without safety or quality outcomes (falls prevented, infection rates, patient satisfaction scores). Task-only bullets read as junior regardless of years on the job.',
      ],
    },
    weakBullet: { ro: 'Am oferit îngrijire pacienților și am administrat medicație pe o secție de medicină internă.', en: 'Provided patient care and administered medications on a medical-surgical unit.' },
    strongBullet: {
      ro: 'Am oferit îngrijire directă la 5-6 pacienți per tură pe o secție de 32 de paturi, reducând rata infecțiilor urinare asociate cateterului de la 3,1 la 0,8 la 1.000 de zile-cateter prin respectarea consecventă a protocolului standard.',
      en: 'Delivered direct care to 5-6 patients per shift on a 32-bed medical-surgical unit, reducing catheter-associated UTI rate from 3.1 to 0.8 per 1,000 catheter days through consistent bundle protocol adherence.',
    },
  },
]

export function getResumeRole(locale: AppLocale, slug: string): ResumeRole | undefined {
  return resumeRoles.find((role) => role.slug[locale] === slug)
}
