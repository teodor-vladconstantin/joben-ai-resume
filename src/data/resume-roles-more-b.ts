// Roles 31-38. Same shape as resume-roles.ts. Copy rules: no em dashes, no "X, not Y" phrasing,
// bullet examples are illustrative.
import type { ResumeRole } from './resume-roles'

export const MORE_ROLES_B: ResumeRole[] = [
  {
    slug: { ro: 'farmacist', en: 'pharmacist' },
    title: { ro: 'Farmacist', en: 'Pharmacist' },
    keywords: {
      ro: ['eliberare medicamente', 'consiliere farmaceutică', 'verificarea prescripțiilor', 'gestionarea stocurilor', 'farmacovigilență', 'legislație farmaceutică', 'relații cu pacienții', 'preparate magistrale', 'sisteme de gestiune farmacie', 'colegiul farmaciștilor', 'achiziții și furnizori', 'raportare'],
      en: ['dispensing medication', 'pharmaceutical counseling', 'prescription verification', 'inventory management', 'pharmacovigilance', 'pharmaceutical regulations', 'patient relations', 'compounded preparations', 'pharmacy management systems', 'professional registration', 'purchasing and suppliers', 'reporting'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am eliberat medicamente” fără volumul zilnic de pacienți sau tipul de farmacie.',
        'Omiți dreptul de liberă practică și formările profesionale continue.',
        'Nu menționezi sistemul de gestiune folosit și responsabilitățile de stoc.',
      ],
      en: [
        'Writing "dispensed medication" without the daily patient volume or the type of pharmacy.',
        'Leaving out your license to practice and continuing professional training.',
        'No mention of the management system used and stock responsibilities.',
      ],
    },
    weakBullet: { ro: 'Am lucrat în farmacie și am servit pacienții.', en: 'Worked in a pharmacy and served patients.' },
    strongBullet: {
      ro: 'Am consiliat în medie 80 de pacienți pe zi într-o farmacie comunitară, am redus pierderile din expirări cu 25% prin rotația stocurilor și am coordonat 3 asistenți.',
      en: 'Counseled an average of 80 patients a day in a community pharmacy, cut expiry losses by 25% through stock rotation and supervised 3 assistants.',
    },
  },
  {
    slug: { ro: 'inginer-mecanic', en: 'mechanical-engineer' },
    title: { ro: 'Inginer Mecanic', en: 'Mechanical Engineer' },
    keywords: {
      ro: ['proiectare CAD', 'SolidWorks', 'AutoCAD', 'analiză cu element finit (FEA)', 'documentație tehnică', 'toleranțe și ajustaje', 'prototipare', 'mentenanță industrială', 'managementul calității (ISO 9001)', 'Lean manufacturing', 'termodinamică', 'controlul proceselor'],
      en: ['CAD design', 'SolidWorks', 'AutoCAD', 'finite element analysis (FEA)', 'technical documentation', 'tolerances and fits', 'prototyping', 'industrial maintenance', 'quality management (ISO 9001)', 'Lean manufacturing', 'thermodynamics', 'process control'],
    },
    commonMistakes: {
      ro: [
        'Listezi programe de proiectare fără proiectele concrete și rezultatele lor.',
        'Omiți dimensiunea și costul componentelor sau al liniilor la care ai lucrat.',
        'Nu menționezi standardele și certificările respectate (ISO, CE).',
      ],
      en: [
        'Listing design software without the concrete projects and their results.',
        'Leaving out the size and cost of the components or lines you worked on.',
        'No mention of the standards and certifications followed (ISO, CE).',
      ],
    },
    weakBullet: { ro: 'Am proiectat piese mecanice în SolidWorks.', en: 'Designed mechanical parts in SolidWorks.' },
    strongBullet: {
      ro: 'Am reproiectat un suport de fixare în SolidWorks și am validat soluția prin FEA, reducând greutatea cu 18% și costul de fabricație cu 12% pentru o serie de 5.000 de bucăți.',
      en: 'Redesigned a mounting bracket in SolidWorks and validated it with FEA, cutting weight by 18% and manufacturing cost by 12% for a run of 5,000 units.',
    },
  },
  {
    slug: { ro: 'specialist-achizitii', en: 'procurement-specialist' },
    title: { ro: 'Specialist Achiziții', en: 'Procurement Specialist' },
    keywords: {
      ro: ['achiziții', 'negocierea contractelor', 'evaluarea furnizorilor', 'cereri de ofertă (RFQ)', 'managementul stocurilor', 'ERP (SAP)', 'reducerea costurilor', 'comparare oferte', 'contracte-cadru', 'logistică', 'conformitate', 'raportare de achiziții'],
      en: ['procurement', 'contract negotiation', 'supplier evaluation', 'requests for quotation (RFQ)', 'inventory management', 'ERP (SAP)', 'cost reduction', 'bid comparison', 'framework agreements', 'logistics', 'compliance', 'procurement reporting'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am făcut achiziții” fără valoarea buget gestionat și numărul de furnizori.',
        'Omiți economiile obținute prin negociere.',
        'Nu menționezi sistemul ERP și procedurile de achiziții cunoscute.',
      ],
      en: [
        'Writing "handled purchasing" without the budget managed and the number of suppliers.',
        'Leaving out the savings achieved through negotiation.',
        'No mention of the ERP system and the procurement procedures you know.',
      ],
    },
    weakBullet: { ro: 'Am comandat materiale de la furnizori.', en: 'Ordered materials from suppliers.' },
    strongBullet: {
      ro: 'Am gestionat un buget anual de achiziții de 2,4 milioane RON cu 45 de furnizori și am obținut economii de 9% prin renegocierea contractelor și consolidarea comenzilor.',
      en: 'Managed an annual procurement budget of RON 2.4 million across 45 suppliers and achieved 9% savings by renegotiating contracts and consolidating orders.',
    },
  },
  {
    slug: { ro: 'tehnician-it', en: 'it-technician' },
    title: { ro: 'Tehnician IT', en: 'IT Technician' },
    keywords: {
      ro: ['suport tehnic', 'depanare hardware și software', 'Windows și Microsoft 365', 'administrare Active Directory', 'rețele (LAN/WLAN)', 'imprimante și echipamente', 'instalare și configurare', 'backup', 'tichete (Jira, Zendesk)', 'securitate de bază', 'inventar echipamente', 'documentare proceduri'],
      en: ['technical support', 'hardware and software troubleshooting', 'Windows and Microsoft 365', 'Active Directory administration', 'networking (LAN/WLAN)', 'printers and equipment', 'installation and configuration', 'backup', 'ticketing (Jira, Zendesk)', 'basic security', 'equipment inventory', 'procedure documentation'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am rezolvat probleme IT” fără volumul de tichete și timpul de rezolvare.',
        'Omiți numărul de utilizatori și echipamente suportate.',
        'Nu menționezi certificările (CompTIA, Microsoft) și uneltele de administrare.',
      ],
      en: [
        'Writing "solved IT problems" without ticket volume and resolution time.',
        'Leaving out the number of users and devices supported.',
        'No mention of certifications (CompTIA, Microsoft) and administration tools.',
      ],
    },
    weakBullet: { ro: 'Am oferit suport IT colegilor din companie.', en: 'Provided IT support to colleagues in the company.' },
    strongBullet: {
      ro: 'Am oferit suport pentru 140 de utilizatori și 160 de echipamente, rezolvând 35 de tichete pe săptămână, cu un timp mediu de rezolvare de 3 ore, și am migrat 90 de conturi în Microsoft 365.',
      en: 'Supported 140 users and 160 devices, resolving 35 tickets a week with an average resolution time of 3 hours, and migrated 90 accounts to Microsoft 365.',
    },
  },
  {
    slug: { ro: 'manager-magazin', en: 'store-manager' },
    title: { ro: 'Manager de Magazin', en: 'Store Manager' },
    keywords: {
      ro: ['managementul echipei', 'obiective de vânzări', 'gestionarea stocurilor', 'merchandising', 'servicii clienți', 'program și pontaj', 'inventariere', 'reducerea pierderilor', 'KPI de magazin', 'recrutare și instruire', 'bugete operaționale', 'raportare'],
      en: ['team management', 'sales targets', 'inventory management', 'merchandising', 'customer service', 'scheduling and timekeeping', 'stock counts', 'shrinkage reduction', 'store KPIs', 'hiring and training', 'operating budgets', 'reporting'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am condus magazinul” fără cifra de afaceri, dimensiunea echipei și targetul atins.',
        'Omiți rezultatele de inventar și pierderile reduse.',
        'Nu menționezi instruirea echipei și fluctuația de personal.',
      ],
      en: [
        'Writing "managed the store" without turnover, team size and target attainment.',
        'Leaving out stock count results and reduced shrinkage.',
        'No mention of team training and staff turnover.',
      ],
    },
    weakBullet: { ro: 'Am condus un magazin și echipa de vânzări.', en: 'Managed a store and the sales team.' },
    strongBullet: {
      ro: 'Am condus un magazin cu 14 angajați și cifră de afaceri de 3,1 milioane RON pe an, depășind targetul cu 7% și reducând pierderile la inventar de la 1,8% la 1,1%.',
      en: 'Ran a store with 14 employees and RON 3.1 million annual turnover, beating the target by 7% and cutting stock shrinkage from 1.8% to 1.1%.',
    },
  },
  {
    slug: { ro: 'arhitect', en: 'architect' },
    title: { ro: 'Arhitect', en: 'Architect' },
    keywords: {
      ro: ['proiectare arhitecturală', 'AutoCAD', 'Revit (BIM)', 'ArchiCAD', 'SketchUp', 'documentație pentru autorizare', 'coordonare cu specialiștii', 'randări 3D', 'legislație urbanism', 'supervizare șantier', 'detalii de execuție', 'portofoliu'],
      en: ['architectural design', 'AutoCAD', 'Revit (BIM)', 'ArchiCAD', 'SketchUp', 'permit documentation', 'coordination with engineers', '3D renderings', 'zoning regulations', 'site supervision', 'construction details', 'portfolio'],
    },
    commonMistakes: {
      ro: [
        'Nu atașezi sau nu legi un portofoliu cu proiecte realizate.',
        'Scrii „am proiectat clădiri” fără tipul, suprafața și faza în care ai lucrat.',
        'Omiți programele BIM și experiența de coordonare cu specialiștii.',
      ],
      en: [
        'No portfolio attached or linked with completed projects.',
        'Writing "designed buildings" without type, area and the phase you worked on.',
        'Leaving out BIM software and experience coordinating with engineers.',
      ],
    },
    weakBullet: { ro: 'Am lucrat la proiecte de arhitectură rezidențială.', en: 'Worked on residential architecture projects.' },
    strongBullet: {
      ro: 'Am proiectat în Revit un ansamblu rezidențial de 48 de apartamente (6.200 mp), de la concept la documentația pentru autorizare, și am coordonat 4 specialiști de instalații și structură.',
      en: 'Designed a 48-apartment residential complex (6,200 sqm) in Revit, from concept to permit documentation, and coordinated 4 MEP and structural engineers.',
    },
  },
  {
    slug: { ro: 'curier', en: 'delivery-driver' },
    title: { ro: 'Curier', en: 'Delivery Driver' },
    keywords: {
      ro: ['livrare colete', 'permis categoria B', 'planificarea rutelor', 'respectarea termenelor', 'aplicații de livrare', 'relații cu clienții', 'manipulare marfă', 'documente de transport', 'condus defensiv', 'încasare numerar', 'predare-primire', 'raportare zilnică'],
      en: ['parcel delivery', 'category B driving licence', 'route planning', 'meeting deadlines', 'delivery apps', 'customer relations', 'cargo handling', 'transport documents', 'defensive driving', 'cash collection', 'handover', 'daily reporting'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am livrat colete” fără numărul zilnic de livrări și rata de livrare la timp.',
        'Omiți categoria permisului și experiența de condus în oraș.',
        'Nu menționezi aplicațiile de livrare și răspunderea pentru marfă.',
      ],
      en: [
        'Writing "delivered parcels" without the daily number of deliveries and the on-time rate.',
        'Leaving out your licence category and city driving experience.',
        'No mention of delivery apps and responsibility for goods.',
      ],
    },
    weakBullet: { ro: 'Am livrat colete către clienți.', en: 'Delivered parcels to customers.' },
    strongBullet: {
      ro: 'Am efectuat în medie 70 de livrări pe zi în București, cu o rată de livrare la timp de 97% și zero incidente de marfă deteriorată în 18 luni.',
      en: 'Completed an average of 70 deliveries a day in Bucharest, with a 97% on-time rate and zero damaged-goods incidents over 18 months.',
    },
  },
  {
    slug: { ro: 'contabil-sef', en: 'chief-accountant' },
    title: { ro: 'Contabil Șef', en: 'Chief Accountant' },
    keywords: {
      ro: ['închideri lunare și anuale', 'situații financiare', 'declarații fiscale', 'e-Factura și SAF-T', 'conducerea echipei', 'IFRS', 'audit intern și extern', 'buget și control', 'optimizare fiscală legală', 'ERP (SAP, SmartBill)', 'raportare către management', 'conformitate'],
      en: ['month-end and year-end close', 'financial statements', 'tax filings', 'e-invoicing and SAF-T', 'team leadership', 'IFRS', 'internal and external audit', 'budgeting and control', 'lawful tax optimization', 'ERP (SAP, SmartBill)', 'management reporting', 'compliance'],
    },
    commonMistakes: {
      ro: [
        'Scrii „am condus contabilitatea” fără dimensiunea companiei, numărul de tranzacții și echipa.',
        'Omiți termenele de închidere îmbunătățite și rezultatele auditurilor.',
        'Nu menționezi sistemul contabil, standardele (RAS, IFRS) și calitatea de membru CECCAR.',
      ],
      en: [
        'Writing "led the accounting" without company size, transaction volume and team.',
        'Leaving out the improved closing times and audit results.',
        'No mention of the accounting system, standards (RAS, IFRS) and professional membership.',
      ],
    },
    weakBullet: { ro: 'Am condus departamentul de contabilitate.', en: 'Led the accounting department.' },
    strongBullet: {
      ro: 'Am condus o echipă de 6 contabili pentru o companie cu 28 de milioane RON cifră de afaceri, am redus închiderea lunară de la 12 la 6 zile lucrătoare și am obținut audit fără rezerve 3 ani la rând.',
      en: 'Led a team of 6 accountants for a company with RON 28 million turnover, cut the month-end close from 12 to 6 working days and obtained a clean audit opinion 3 years in a row.',
    },
  },
]
