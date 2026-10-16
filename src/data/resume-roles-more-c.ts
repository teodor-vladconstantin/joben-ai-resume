// Roles 39-46. Same shape as resume-roles.ts. Copy rules: no em dashes, no "X, not Y" phrasing,
// bullet examples are illustrative.
import type { ResumeRole } from './resume-roles'

export const MORE_ROLES_C: ResumeRole[] = [
  {
    slug: { ro: 'electrician', en: 'electrician' },
    title: { ro: 'Electrician', en: 'Electrician' },
    keywords: {
      ro: ['instalații electrice', 'tablouri electrice', 'citire scheme electrice', 'verificări și măsurători', 'mentenanță electrică', 'norme de securitate (SSM)', 'autorizare ANRE', 'cabluri și protecții', 'iluminat', 'depanare', 'instalații industriale', 'documentație de lucrare'],
      en: ['electrical installations', 'electrical panels', 'reading electrical diagrams', 'testing and measurements', 'electrical maintenance', 'safety regulations', 'professional authorization', 'cables and protection', 'lighting', 'troubleshooting', 'industrial installations', 'work documentation'],
    },
    commonMistakes: {
      ro: [
        'Omiți autorizările și atestatele profesionale, pe care angajatorii le verifică primele.',
        'Scrii „am făcut instalații” fără tipul clădirii, puterea sau numărul de proiecte.',
        'Nu menționezi respectarea normelor de securitate și lipsa accidentelor.',
      ],
      en: [
        'Leaving out authorizations and professional certificates, which employers check first.',
        'Writing "did installations" without the building type, power rating or number of projects.',
        'No mention of safety compliance and a clean accident record.',
      ],
    },
    weakBullet: { ro: 'Am executat instalații electrice în clădiri.', en: 'Carried out electrical installations in buildings.' },
    strongBullet: {
      ro: 'Am executat instalațiile electrice a 22 de apartamente într-un bloc nou, de la tablouri la iluminat, cu predare la termen și zero accidente de muncă pe tot șantierul.',
      en: 'Carried out the electrical installations for 22 apartments in a new building, from panels to lighting, delivered on time with zero workplace accidents across the site.',
    },
  },
  {
    slug: { ro: 'operator-introducere-date', en: 'data-entry-operator' },
    title: { ro: 'Operator Introducere Date', en: 'Data Entry Operator' },
    keywords: {
      ro: ['introducere date', 'viteză de tastare', 'acuratețe', 'Microsoft Excel', 'verificarea datelor', 'baze de date', 'confidențialitate', 'documente scanate', 'ERP', 'organizare', 'raportare', 'atenție la detalii'],
      en: ['data entry', 'typing speed', 'accuracy', 'Microsoft Excel', 'data verification', 'databases', 'confidentiality', 'scanned documents', 'ERP', 'organization', 'reporting', 'attention to detail'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am introdus date” fără volumul zilnic și rata de erori.',
        'Omiți viteza de tastare și programele cunoscute.',
        'Nu menționezi acuratețea și controlul calității datelor.',
      ],
      en: [
        'Writing "entered data" without the daily volume and the error rate.',
        'Leaving out typing speed and the software you know.',
        'No mention of accuracy and data quality checks.',
      ],
    },
    weakBullet: { ro: 'Am introdus date în sistemul companiei.', en: 'Entered data into the company system.' },
    strongBullet: {
      ro: 'Am introdus zilnic în medie 400 de înregistrări în ERP cu o acuratețe de 99,6% și am creat un șablon de verificare în Excel care a redus corecturile cu 30%.',
      en: 'Entered an average of 400 records a day into the ERP with 99.6% accuracy and built an Excel checking template that cut corrections by 30%.',
    },
  },
  {
    slug: { ro: 'barista-ospatar', en: 'barista-waiter' },
    title: { ro: 'Barista și Ospătar', en: 'Barista and Waiter' },
    keywords: {
      ro: ['servire clienți', 'preparare cafea', 'lucru în echipă', 'casă de marcat (POS)', 'igienă alimentară (HACCP)', 'comunicare', 'lucru sub presiune', 'recomandări de meniu', 'limba engleză', 'program flexibil', 'curățenie și organizare', 'upselling'],
      en: ['customer service', 'coffee preparation', 'teamwork', 'point of sale (POS)', 'food hygiene (HACCP)', 'communication', 'working under pressure', 'menu recommendations', 'English language', 'flexible schedule', 'cleanliness and organization', 'upselling'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am servit clienți” fără volumul de clienți sau numărul de mese gestionate.',
        'Omiți atestatul de igienă și limbile străine vorbite.',
        'Nu menționezi rezultatele: recenzii bune, vânzări suplimentare, recomandări.',
      ],
      en: [
        'Writing "served customers" without customer volume or the number of tables handled.',
        'Leaving out the hygiene certificate and foreign languages spoken.',
        'No mention of results: good reviews, extra sales, referrals.',
      ],
    },
    weakBullet: { ro: 'Am lucrat ca ospătar într-un restaurant.', en: 'Worked as a waiter in a restaurant.' },
    strongBullet: {
      ro: 'Am servit în medie 15 mese pe tură într-un restaurant cu 80 de locuri, am crescut vânzările de băuturi cu 12% prin recomandări de meniu și am primit calificativul „angajatul lunii” de 3 ori.',
      en: 'Served an average of 15 tables per shift in an 80-seat restaurant, raised drink sales by 12% through menu recommendations and earned "employee of the month" 3 times.',
    },
  },
  {
    slug: { ro: 'sofer', en: 'driver' },
    title: { ro: 'Șofer', en: 'Driver' },
    keywords: {
      ro: ['permis categoria B, C sau CE', 'atestat profesional', 'transport marfă', 'planificarea rutelor', 'conducere defensivă', 'tahograf', 'documente de transport (CMR)', 'ADR', 'întreținere vehicul', 'termene de livrare', 'GPS și aplicații', 'limba engleză'],
      en: ['licence category B, C or CE', 'professional certificate', 'freight transport', 'route planning', 'defensive driving', 'tachograph', 'transport documents (CMR)', 'ADR', 'vehicle upkeep', 'delivery deadlines', 'GPS and apps', 'English language'],
    },
    commonMistakes: {
      ro: [
        'Omiți categoriile permisului și atestatele din prima parte a CV-ului.',
        'Scrii „am condus camioane” fără kilometri, rute sau tipul de transport.',
        'Nu menționezi lipsa incidentelor și respectarea termenelor.',
      ],
      en: [
        'Leaving out licence categories and certificates from the top of the resume.',
        'Writing "drove trucks" without kilometres, routes or the type of transport.',
        'No mention of a clean incident record and met deadlines.',
      ],
    },
    weakBullet: { ro: 'Am condus camioane pe rute interne și externe.', en: 'Drove trucks on domestic and international routes.' },
    strongBullet: {
      ro: 'Am parcurs peste 120.000 km pe an în transport internațional (România, Ungaria, Germania), cu livrări la timp în 98% din curse și zero incidente de marfă deteriorată în 3 ani.',
      en: 'Drove over 120,000 km a year in international transport (Romania, Hungary, Germany), with on-time delivery on 98% of runs and zero damaged-goods incidents in 3 years.',
    },
  },
  {
    slug: { ro: 'consultant-financiar', en: 'financial-consultant' },
    title: { ro: 'Consultant Financiar', en: 'Financial Consultant' },
    keywords: {
      ro: ['planificare financiară', 'consultanță clienți', 'analiza portofoliului', 'produse de economisire și investiții', 'evaluarea riscului', 'conformitate (KYC, AML)', 'prezentări către clienți', 'CRM', 'modelare financiară', 'Excel avansat', 'relații pe termen lung', 'raportare'],
      en: ['financial planning', 'client advisory', 'portfolio analysis', 'savings and investment products', 'risk assessment', 'compliance (KYC, AML)', 'client presentations', 'CRM', 'financial modeling', 'advanced Excel', 'long-term relationships', 'reporting'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am consiliat clienți” fără numărul de clienți, valoarea portofoliilor și tipul de produse.',
        'Omiți autorizările și certificările necesare activității.',
        'Nu menționezi rezultatele pentru clienți și retenția acestora.',
      ],
      en: [
        'Writing "advised clients" without the number of clients, portfolio value and product types.',
        'Leaving out the authorizations and certifications the activity requires.',
        'No mention of client outcomes and retention.',
      ],
    },
    weakBullet: { ro: 'Am oferit consultanță financiară clienților.', en: 'Provided financial advice to clients.' },
    strongBullet: {
      ro: 'Am gestionat un portofoliu de 85 de clienți cu active totale de 14 milioane RON, am menținut o rată de retenție de 94% și am introdus o ședință anuală de revizuire a obiectivelor.',
      en: 'Managed a portfolio of 85 clients with total assets of RON 14 million, kept a 94% retention rate and introduced an annual goals review meeting.',
    },
  },
  {
    slug: { ro: 'motion-designer', en: 'motion-designer' },
    title: { ro: 'Motion Designer', en: 'Motion Designer' },
    keywords: {
      ro: ['animație 2D și 3D', 'After Effects', 'Premiere Pro', 'Cinema 4D', 'Illustrator', 'storyboard', 'editare video', 'identitate vizuală animată', 'sunet și ritm', 'portofoliu / showreel', 'colaborare cu echipa creativă', 'livrare pentru social media'],
      en: ['2D and 3D animation', 'After Effects', 'Premiere Pro', 'Cinema 4D', 'Illustrator', 'storyboarding', 'video editing', 'animated visual identity', 'sound and rhythm', 'portfolio / showreel', 'collaboration with the creative team', 'delivery for social media'],
    },
    commonMistakes: {
      ro: [
        'Nu legi un showreel sau un portofoliu online.',
        'Listezi programe fără proiecte, clienți și rezultate.',
        'Omiți formatele livrate și cerințele de platformă cunoscute.',
      ],
      en: [
        'No link to a showreel or an online portfolio.',
        'Listing software without projects, clients and results.',
        'Leaving out the formats delivered and the platform requirements you know.',
      ],
    },
    weakBullet: { ro: 'Am creat animații pentru clienți.', en: 'Created animations for clients.' },
    strongBullet: {
      ro: 'Am realizat 40 de animații de 15-30 de secunde în After Effects pentru campanii de social media, cu un videoclip care a depășit 1,2 milioane de vizualizări.',
      en: 'Produced 40 animations of 15 to 30 seconds in After Effects for social media campaigns, including one video that passed 1.2 million views.',
    },
  },
  {
    slug: { ro: 'coordonator-de-proiect', en: 'project-coordinator' },
    title: { ro: 'Coordonator de Proiect', en: 'Project Coordinator' },
    keywords: {
      ro: ['coordonarea proiectelor', 'planificare și grafice', 'comunicare cu echipa', 'urmărirea termenelor', 'raportare de progres', 'Jira', 'Asana', 'Microsoft Project', 'gestionarea documentației', 'ședințe de status', 'buget de proiect', 'Agile'],
      en: ['project coordination', 'planning and schedules', 'team communication', 'deadline tracking', 'progress reporting', 'Jira', 'Asana', 'Microsoft Project', 'documentation management', 'status meetings', 'project budget', 'Agile'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am coordonat proiecte” fără numărul de proiecte, dimensiunea echipei și bugetul.',
        'Omiți termenele respectate și rezultatele livrate.',
        'Nu menționezi metodologiile și uneltele de management folosite.',
      ],
      en: [
        'Writing "coordinated projects" without the number of projects, team size and budget.',
        'Leaving out the deadlines met and the results delivered.',
        'No mention of the methodologies and management tools used.',
      ],
    },
    weakBullet: { ro: 'Am coordonat proiecte și am ținut legătura cu echipa.', en: 'Coordinated projects and kept in touch with the team.' },
    strongBullet: {
      ro: 'Am coordonat 6 proiecte simultane cu echipe de 4-9 persoane și bugete de până la 250.000 RON, livrate la termen în 11 din 12 cazuri, folosind Jira și ședințe săptămânale de status.',
      en: 'Coordinated 6 concurrent projects with teams of 4 to 9 people and budgets up to RON 250,000, delivered on time in 11 of 12 cases using Jira and weekly status meetings.',
    },
  },
  {
    slug: { ro: 'analist-securitate-cibernetica', en: 'cybersecurity-analyst' },
    title: { ro: 'Analist Securitate Cibernetică', en: 'Cybersecurity Analyst' },
    keywords: {
      ro: ['monitorizare SIEM', 'răspuns la incidente', 'analiza vulnerabilităților', 'testare de penetrare', 'securitatea rețelelor', 'firewall și IDS/IPS', 'ISO 27001', 'GDPR', 'Splunk', 'Wireshark', 'securitate cloud', 'evaluare de risc'],
      en: ['SIEM monitoring', 'incident response', 'vulnerability analysis', 'penetration testing', 'network security', 'firewall and IDS/IPS', 'ISO 27001', 'GDPR', 'Splunk', 'Wireshark', 'cloud security', 'risk assessment'],
    },
    commonMistakes: {
      ro: [
        'Listezi unelte fără incidentele tratate și timpul de răspuns.',
        'Omiți certificările (Security+, CEH, CISSP) și laboratoarele practice.',
        'Nu menționezi dimensiunea infrastructurii monitorizate.',
      ],
      en: [
        'Listing tools without the incidents handled and response time.',
        'Leaving out certifications (Security+, CEH, CISSP) and hands-on labs.',
        'No mention of the size of the infrastructure monitored.',
      ],
    },
    weakBullet: { ro: 'Am monitorizat securitatea sistemelor companiei.', en: 'Monitored the security of company systems.' },
    strongBullet: {
      ro: 'Am monitorizat în Splunk o infrastructură de 600 de endpoint-uri, am tratat 45 de incidente într-un an cu un timp mediu de răspuns de 25 de minute și am închis 120 de vulnerabilități critice.',
      en: 'Monitored a 600-endpoint infrastructure in Splunk, handled 45 incidents in a year with an average response time of 25 minutes and closed 120 critical vulnerabilities.',
    },
  },
]
