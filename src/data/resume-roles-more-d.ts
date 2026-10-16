// Roles 47-54. Same shape as resume-roles.ts. Copy rules: no em dashes, no "X, not Y" phrasing,
// bullet examples are illustrative.
import type { ResumeRole } from './resume-roles'

export const MORE_ROLES_D: ResumeRole[] = [
  {
    slug: { ro: 'dezvoltator-backend', en: 'backend-developer' },
    title: { ro: 'Dezvoltator Backend', en: 'Backend Developer' },
    keywords: {
      ro: ['API REST', 'Node.js', 'Python', 'Java', 'PostgreSQL', 'Redis', 'microservicii', 'Docker', 'testare automată', 'CI/CD', 'securitatea API-urilor', 'optimizarea performanței'],
      en: ['REST APIs', 'Node.js', 'Python', 'Java', 'PostgreSQL', 'Redis', 'microservices', 'Docker', 'automated testing', 'CI/CD', 'API security', 'performance optimization'],
    },
    commonMistakes: {
      ro: [
        'Listezi limbaje și framework-uri fără proiectele în care le-ai folosit.',
        'Omiți metricile de performanță: timp de răspuns, cereri pe secundă, disponibilitate.',
        'Nu menționezi testarea, monitorizarea și lucrul cu echipa de frontend.',
      ],
      en: [
        'Listing languages and frameworks without the projects where you used them.',
        'Leaving out performance metrics: response time, requests per second, uptime.',
        'No mention of testing, monitoring and working with the frontend team.',
      ],
    },
    weakBullet: { ro: 'Am dezvoltat API-uri pentru aplicația companiei.', en: 'Developed APIs for the company application.' },
    strongBullet: {
      ro: 'Am proiectat un API REST în Node.js și PostgreSQL pentru 120.000 de utilizatori activi, am adăugat cache cu Redis și am redus timpul mediu de răspuns de la 620 ms la 180 ms.',
      en: 'Designed a REST API in Node.js and PostgreSQL for 120,000 active users, added Redis caching and cut the average response time from 620 ms to 180 ms.',
    },
  },
  {
    slug: { ro: 'dezvoltator-mobile', en: 'mobile-developer' },
    title: { ro: 'Dezvoltator Mobile', en: 'Mobile Developer' },
    keywords: {
      ro: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'publicare în App Store și Google Play', 'notificări push', 'integrare API', 'testare pe dispozitive', 'optimizarea performanței', 'UI nativ', 'analytics mobile', 'CI/CD pentru aplicații'],
      en: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'publishing to the App Store and Google Play', 'push notifications', 'API integration', 'device testing', 'performance optimization', 'native UI', 'mobile analytics', 'CI/CD for apps'],
    },
    commonMistakes: {
      ro: [
        'Nu legi aplicațiile publicate din magazine.',
        'Omiți numărul de descărcări, ratingul și rata de crash.',
        'Nu menționezi platformele (iOS, Android) și versiunile suportate.',
      ],
      en: [
        'No links to apps published in the stores.',
        'Leaving out downloads, rating and crash rate.',
        'No mention of the platforms (iOS, Android) and supported versions.',
      ],
    },
    weakBullet: { ro: 'Am lucrat la aplicația mobilă a companiei.', en: 'Worked on the company mobile app.' },
    strongBullet: {
      ro: 'Am dezvoltat în React Native o aplicație cu peste 50.000 de descărcări și rating 4,6, am redus rata de crash de la 2,4% la 0,6% și am automatizat publicarea în ambele magazine.',
      en: 'Built a React Native app with over 50,000 downloads and a 4.6 rating, cut the crash rate from 2.4% to 0.6% and automated publishing to both stores.',
    },
  },
  {
    slug: { ro: 'inginer-constructor', en: 'civil-engineer' },
    title: { ro: 'Inginer Constructor', en: 'Civil Engineer' },
    keywords: {
      ro: ['proiectare structuri', 'AutoCAD', 'Revit', 'calcul structural', 'managementul șantierului', 'devize și cantități', 'norme și standarde de construcții', 'supervizare execuție', 'coordonarea subcontractorilor', 'siguranța muncii', 'documentație pentru autorizare', 'controlul calității'],
      en: ['structural design', 'AutoCAD', 'Revit', 'structural analysis', 'site management', 'cost estimates and quantities', 'building codes and standards', 'execution supervision', 'subcontractor coordination', 'workplace safety', 'permit documentation', 'quality control'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am lucrat la proiecte de construcții” fără tipul, valoarea și rolul tău.',
        'Omiți termenele și bugetele respectate.',
        'Nu menționezi dreptul de semnătură și atestatele profesionale.',
      ],
      en: [
        'Writing "worked on construction projects" without type, value and your role.',
        'Leaving out the deadlines and budgets met.',
        'No mention of signing authority and professional certificates.',
      ],
    },
    weakBullet: { ro: 'Am supervizat execuția unor lucrări de construcții.', en: 'Supervised the execution of construction works.' },
    strongBullet: {
      ro: 'Am coordonat execuția unui bloc de 64 de apartamente (valoare 18 milioane RON) cu 5 subcontractori, am livrat la termen și cu o depășire de buget sub 2%.',
      en: 'Coordinated the execution of a 64-apartment building (value RON 18 million) with 5 subcontractors, delivering on time with a budget overrun under 2%.',
    },
  },
  {
    slug: { ro: 'mecanic-auto', en: 'auto-mechanic' },
    title: { ro: 'Mecanic Auto', en: 'Auto Mechanic' },
    keywords: {
      ro: ['diagnoză auto', 'reparații motor și transmisie', 'sisteme de frânare', 'electrică auto', 'echipamente de diagnoză', 'întreținere periodică', 'vehicule hibrid și electrice', 'service autorizat', 'ITP', 'piese și comenzi', 'relația cu clienții', 'norme de siguranță'],
      en: ['automotive diagnostics', 'engine and transmission repair', 'braking systems', 'automotive electrics', 'diagnostic equipment', 'periodic maintenance', 'hybrid and electric vehicles', 'authorized service', 'inspection', 'parts and orders', 'customer relations', 'safety rules'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am reparat mașini” fără tipul de vehicule și de intervenții.',
        'Omiți echipamentele de diagnoză și cursurile de specializare.',
        'Nu menționezi viteza, calitatea și lipsa reclamațiilor.',
      ],
      en: [
        'Writing "repaired cars" without the vehicle types and the kinds of jobs.',
        'Leaving out diagnostic equipment and specialization courses.',
        'No mention of speed, quality and a low rate of complaints.',
      ],
    },
    weakBullet: { ro: 'Am reparat mașini într-un service auto.', en: 'Repaired cars in an auto service shop.' },
    strongBullet: {
      ro: 'Am efectuat diagnoze și reparații pentru 8-10 vehicule pe săptămână într-un service autorizat, cu o rată de revenire la garanție sub 1%, și am absolvit cursul pentru vehicule hibrid.',
      en: 'Carried out diagnostics and repairs on 8 to 10 vehicles a week in an authorized service center, with a warranty return rate under 1%, and completed the hybrid vehicle course.',
    },
  },
  {
    slug: { ro: 'consilier-vanzari-magazin', en: 'sales-associate' },
    title: { ro: 'Consilier Vânzări Magazin', en: 'Sales Associate' },
    keywords: {
      ro: ['vânzări în magazin', 'servicii clienți', 'casă de marcat (POS)', 'merchandising', 'inventariere', 'vânzare complementară', 'cunoașterea produselor', 'lucru în echipă', 'rezolvarea reclamațiilor', 'program flexibil', 'limba engleză', 'targeturi de vânzări'],
      en: ['in-store sales', 'customer service', 'point of sale (POS)', 'merchandising', 'stock counts', 'cross-selling', 'product knowledge', 'teamwork', 'complaint resolution', 'flexible schedule', 'English language', 'sales targets'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am vândut produse” fără target, rezultat sau categoria de produse.',
        'Omiți cunoștințele despre produse și instruirile urmate.',
        'Nu menționezi programul pe care îl poți lucra.',
      ],
      en: [
        'Writing "sold products" without a target, result or product category.',
        'Leaving out product knowledge and training completed.',
        'No mention of the schedule you can work.',
      ],
    },
    weakBullet: { ro: 'Am vândut produse clienților din magazin.', en: 'Sold products to customers in the store.' },
    strongBullet: {
      ro: 'Am servit în medie 45 de clienți pe zi într-un magazin de electronice, am depășit targetul individual cu 11% și am crescut vânzările de accesorii cu 18% prin recomandări personalizate.',
      en: 'Served an average of 45 customers a day in an electronics store, beat the individual target by 11% and raised accessory sales by 18% through personalized recommendations.',
    },
  },
  {
    slug: { ro: 'bucatar', en: 'cook' },
    title: { ro: 'Bucătar', en: 'Cook' },
    keywords: {
      ro: ['preparare culinară', 'HACCP și igienă alimentară', 'gestionarea stocurilor', 'planificarea meniului', 'lucru în bucătărie profesională', 'tehnici de gătit', 'controlul porțiilor și al costurilor', 'lucru sub presiune', 'coordonarea echipei', 'curățenie și organizare', 'alergeni', 'fișe tehnice'],
      en: ['culinary preparation', 'HACCP and food hygiene', 'inventory management', 'menu planning', 'professional kitchen work', 'cooking techniques', 'portion and cost control', 'working under pressure', 'team coordination', 'cleanliness and organization', 'allergens', 'recipe cards'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am gătit în restaurant” fără tipul de bucătărie, volumul de comenzi și rolul.',
        'Omiți atestatele de igienă și formarea profesională.',
        'Nu menționezi controlul costurilor și reducerea risipei.',
      ],
      en: [
        'Writing "cooked in a restaurant" without the cuisine, order volume and role.',
        'Leaving out hygiene certificates and professional training.',
        'No mention of cost control and waste reduction.',
      ],
    },
    weakBullet: { ro: 'Am gătit într-un restaurant.', en: 'Cooked in a restaurant.' },
    strongBullet: {
      ro: 'Am pregătit în medie 120 de porții pe tură într-un restaurant cu bucătărie românească, am redus risipa alimentară cu 15% prin planificarea stocurilor și am instruit 2 ucenici.',
      en: 'Prepared an average of 120 portions per shift in a Romanian cuisine restaurant, cut food waste by 15% through stock planning and trained 2 apprentices.',
    },
  },
  {
    slug: { ro: 'content-manager', en: 'content-manager' },
    title: { ro: 'Content Manager', en: 'Content Manager' },
    keywords: {
      ro: ['strategie de conținut', 'calendar editorial', 'SEO pentru conținut', 'redactare și editare', 'CMS (WordPress)', 'Google Analytics 4', 'coordonarea autorilor', 'distribuție pe canale', 'analiza performanței', 'ton și voce de brand', 'newsletter', 'cercetare de cuvinte cheie'],
      en: ['content strategy', 'editorial calendar', 'SEO for content', 'writing and editing', 'CMS (WordPress)', 'Google Analytics 4', 'coordinating writers', 'channel distribution', 'performance analysis', 'brand tone and voice', 'newsletter', 'keyword research'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am creat conținut” fără volum, canale și rezultate.',
        'Omiți traficul, conversiile sau creșterea audienței.',
        'Nu menționezi uneltele (CMS, analytics) și coordonarea echipei.',
      ],
      en: [
        'Writing "created content" without volume, channels and results.',
        'Leaving out traffic, conversions or audience growth.',
        'No mention of the tools (CMS, analytics) and team coordination.',
      ],
    },
    weakBullet: { ro: 'Am creat conținut pentru blogul și rețelele companiei.', en: 'Created content for the company blog and social channels.' },
    strongBullet: {
      ro: 'Am coordonat un calendar editorial de 30 de articole pe lună cu 6 autori, am crescut traficul organic al blogului de la 22.000 la 48.000 de sesiuni lunare în 9 luni și am dublat abonații newsletterului.',
      en: 'Ran an editorial calendar of 30 articles a month with 6 writers, grew the blog\'s organic traffic from 22,000 to 48,000 monthly sessions in 9 months and doubled newsletter subscribers.',
    },
  },
  {
    slug: { ro: 'asistent-resurse-umane', en: 'hr-assistant' },
    title: { ro: 'Asistent Resurse Umane', en: 'HR Assistant' },
    keywords: {
      ro: ['administrarea personalului', 'contracte de muncă', 'dosare de personal', 'pontaj și concedii', 'Revisal', 'recrutare de bază', 'onboarding', 'legislația muncii', 'confidențialitate (GDPR)', 'Excel', 'comunicare cu angajații', 'rapoarte HR'],
      en: ['personnel administration', 'employment contracts', 'personnel files', 'timekeeping and leave', 'employee registry', 'basic recruiting', 'onboarding', 'employment law', 'confidentiality (GDPR)', 'Excel', 'employee communication', 'HR reports'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am lucrat cu dosarele angajaților” fără numărul de angajați și procesele gestionate.',
        'Omiți cunoștințele de legislația muncii și sistemele HR folosite.',
        'Nu menționezi confidențialitatea datelor și rigoarea în documente.',
      ],
      en: [
        'Writing "worked with employee files" without the headcount and processes handled.',
        'Leaving out knowledge of employment law and the HR systems used.',
        'No mention of data confidentiality and document accuracy.',
      ],
    },
    weakBullet: { ro: 'Am ajutat departamentul de HR cu documentele.', en: 'Helped the HR department with documents.' },
    strongBullet: {
      ro: 'Am administrat dosarele a 220 de angajați, am pregătit lunar pontajul și raportările și am redus timpul de întocmire a contractelor noi de la 3 zile la 1 zi prin șabloane standardizate.',
      en: 'Administered the files of 220 employees, prepared monthly timekeeping and reports and cut the time to draft new contracts from 3 days to 1 through standardized templates.',
    },
  },
]
