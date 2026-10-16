// Guides 26-33. See guides.ts for the model. Copy rules: no em dashes, no "X, not Y" phrasing,
// no invented statistics. Country-specific claims are hedged and point to local checks.
import type { Guide } from './guides'

const DATE = '2026-10-16'

export const MORE_GUIDES_E: Guide[] = [
  {
    datePublished: DATE,
    dateModified: DATE,
    content: {
      ro: {
        slug: 'cv-pentru-joburi-in-it',
        title: 'CV pentru joburi în IT: structură și proiecte',
        description: 'Cum scrii un CV pentru roluri în IT: stack tehnologic, proiecte cu metrici, GitHub, certificări și greșeli frecvente.',
        answer:
          'Un CV pentru IT pune în față stack-ul tehnologic și proiectele cu rezultate măsurabile (performanță, utilizatori, costuri), apoi experiența și educația. Scrie tehnologiile cu numele exact din anunț, leagă GitHub-ul sau portofoliul ca text și păstrează o pagină sau două. Cifrele și linkurile verificabile contează mai mult decât lista lungă de tehnologii.',
        sections: [
          {
            heading: 'Cum prezint stack-ul tehnologic?',
            paragraphs: [
              'Grupează tehnologiile pe categorii: limbaje, framework-uri, baze de date, cloud și DevOps, unelte. Pune în față ce cere anunțul și scrie nivelul în cuvinte („lucrez zilnic cu”, „noțiuni de bază”).',
            ],
          },
          {
            heading: 'Cum descriu un proiect IT?',
            paragraphs: [
              'Schema: problema, soluția tehnică, rezultatul. Exemplu ilustrativ: „Am migrat un API monolitic către servicii separate în Node.js și PostgreSQL, reducând timpul de răspuns de la 800 ms la 240 ms pentru 50.000 de cereri pe zi.”',
            ],
          },
          {
            heading: 'Ce adaug în afară de experiență?',
            paragraphs: ['Elementele care arată seriozitatea tehnică:'],
            items: [
              'Link către GitHub sau portofoliu, scris ca text.',
              'Certificări relevante (cloud, securitate, testare), cu anul.',
              'Contribuții open source, articole sau prezentări, dacă ai.',
            ],
          },
          {
            heading: 'Ce greșeli evit?',
            paragraphs: [
              'Listele de 40 de tehnologii fără context, lipsa metricilor și a linkurilor și descrierile de responsabilități în loc de realizări. Un recrutor tehnic verifică rapid dacă proiectele sunt reale.',
            ],
          },
        ],
        faq: [
          {
            question: 'Trebuie să menționez toate tehnologiile pe care le-am atins?',
            answer: 'Doar pe cele relevante pentru post și pe cele pe care le poți discuta la interviu.',
          },
          {
            question: 'Cât de lung este un CV de IT?',
            answer: 'Una sau două pagini. Proiectele extinse pot fi în GitHub sau în portofoliu.',
          },
          {
            question: 'Ajută certificările?',
            answer: 'Da, mai ales la început de carieră sau la schimbarea domeniului. Pe măsură ce experiența crește, proiectele cântăresc mai mult.',
          },
        ],
      },
      en: {
        slug: 'resume-for-it-jobs',
        title: 'Resume for IT jobs: structure and projects',
        description: 'How to write a resume for IT roles: tech stack, projects with metrics, GitHub, certifications and common mistakes.',
        answer:
          'An IT resume puts the tech stack and projects with measurable results (performance, users, costs) up front, then experience and education. Write technologies with the exact names from the posting, link your GitHub or portfolio as text and keep it to one or two pages. Figures and verifiable links count for more than a long list of technologies.',
        sections: [
          {
            heading: 'How do I present the tech stack?',
            paragraphs: [
              'Group technologies by category: languages, frameworks, databases, cloud and DevOps, tools. Put what the posting asks for first and write the level in words ("work with daily", "basic knowledge").',
            ],
          },
          {
            heading: 'How do I describe an IT project?',
            paragraphs: [
              'The pattern: problem, technical solution, result. Illustrative example: "Migrated a monolithic API to separate services in Node.js and PostgreSQL, cutting response time from 800 ms to 240 ms for 50,000 requests a day."',
            ],
          },
          {
            heading: 'What do I add beyond experience?',
            paragraphs: ['Elements that show technical seriousness:'],
            items: [
              'A link to GitHub or a portfolio, written as text.',
              'Relevant certifications (cloud, security, testing), with the year.',
              'Open source contributions, articles or talks, if you have them.',
            ],
          },
          {
            heading: 'What mistakes do I avoid?',
            paragraphs: [
              'Lists of 40 technologies without context, missing metrics and links, and descriptions of responsibilities in place of achievements. A technical recruiter quickly checks whether the projects are real.',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I list every technology I have touched?',
            answer: 'Only those relevant to the role and those you can discuss in the interview.',
          },
          {
            question: 'How long is an IT resume?',
            answer: 'One or two pages. Extended projects can live on GitHub or in a portfolio.',
          },
          {
            question: 'Do certifications help?',
            answer: 'Yes, especially early in your career or when switching fields. As experience grows, projects weigh more.',
          },
        ],
      },
    },
  },
  {
    datePublished: DATE,
    dateModified: DATE,
    content: {
      ro: {
        slug: 'cv-pentru-horeca',
        title: 'CV pentru HoReCa: restaurant, hotel, cafenea',
        description: 'Cum scrii un CV pentru joburi în HoReCa: experiență, program, limbi străine, atestate de igienă și rezultate din sală sau bucătărie.',
        answer:
          'Un CV pentru HoReCa pune în față experiența în servicii, atestatele (igienă, HACCP) și limbile străine, apoi rezultatele: volum de clienți, recenzii, vânzări suplimentare. Păstrează-l la o pagină, cu locurile de muncă recente primele, și menționează disponibilitatea de program, pentru că angajatorii o caută.',
        sections: [
          {
            heading: 'Ce pun primul?',
            paragraphs: [
              'Rolul urmărit (ospătar, barman, bucătar, recepționer hotel), anii de experiență și limbile vorbite. Imediat după, atestatele cerute de angajator.',
            ],
          },
          {
            heading: 'Cum descriu experiența?',
            paragraphs: [
              'Tipul locației (restaurant cu 80 de locuri, hotel de 4 stele, cafenea de specialitate), volumul și rezultatul. Exemplu ilustrativ: „Am servit în medie 20 de mese pe tură într-un restaurant cu 80 de locuri și am crescut vânzările de deserturi cu 15% prin recomandări de meniu.”',
            ],
          },
          {
            heading: 'Ce limbi și competențe contează?',
            paragraphs: ['Elemente căutate în HoReCa:'],
            items: [
              'Limbi străine cu nivelul scris în cuvinte, esențiale în turism.',
              'Utilizarea sistemelor POS și de rezervări.',
              'Lucru în echipă, gestionarea clienților dificili, lucru în program flexibil.',
            ],
          },
          {
            heading: 'Ce greșeli evit?',
            paragraphs: [
              'Un CV fără date de contact clare, fără limbi străine sau fără precizarea disponibilității (sezon, weekend, ture). Pune telefonul în corpul paginii și ține formatul simplu.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pun poză în CV-ul pentru HoReCa?',
            answer: 'Este opțional. În servicii unele angajatoare o așteaptă, altele nu. Urmărește anunțul.',
          },
          {
            question: 'Cum arăt experiența sezonieră?',
            answer: 'Cu perioada exactă și locația, la fel ca la un job obișnuit. Mai multe sezoane la același angajator pot fi grupate.',
          },
          {
            question: 'Contează referințele?',
            answer: 'Da. Un fost șef de sală sau manager poate confirma fiabilitatea, deci ai grijă să ai acordul lui.',
          },
        ],
      },
      en: {
        slug: 'hospitality-resume',
        title: 'Resume for hospitality: restaurant, hotel, cafe',
        description: 'How to write a hospitality resume: experience, schedule, languages, hygiene certificates and results from the floor or the kitchen.',
        answer:
          'A hospitality resume puts service experience, certificates (hygiene, HACCP) and languages up front, then results: customer volume, reviews, upsells. Keep it to one page, with recent jobs first, and state your schedule availability, since employers look for it.',
        sections: [
          {
            heading: 'What goes first?',
            paragraphs: [
              'The role you want (waiter, bartender, cook, hotel receptionist), years of experience and languages spoken. Right after, the certificates the employer requires.',
            ],
          },
          {
            heading: 'How do I describe experience?',
            paragraphs: [
              'The type of venue (80-seat restaurant, 4-star hotel, specialty cafe), the volume and the result. Illustrative example: "Served an average of 20 tables per shift in an 80-seat restaurant and raised dessert sales by 15% through menu recommendations."',
            ],
          },
          {
            heading: 'Which languages and skills matter?',
            paragraphs: ['Elements sought in hospitality:'],
            items: [
              'Foreign languages with the level written in words, essential in tourism.',
              'Use of POS and reservation systems.',
              'Teamwork, handling difficult guests, working a flexible schedule.',
            ],
          },
          {
            heading: 'What mistakes do I avoid?',
            paragraphs: [
              'A resume without clear contact details, without languages or without stated availability (season, weekends, shifts). Put your phone number in the body of the page and keep the format simple.',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I add a photo to a hospitality resume?',
            answer: 'It is optional. In service roles some employers expect one and others do not. Follow the posting.',
          },
          {
            question: 'How do I show seasonal work?',
            answer: 'With the exact dates and venue, like any other job. Several seasons at the same employer can be grouped.',
          },
          {
            question: 'Do references matter?',
            answer: 'Yes. A former head waiter or manager can confirm reliability, so make sure you have their permission.',
          },
        ],
      },
    },
  },
  {
    datePublished: DATE,
    dateModified: DATE,
    content: {
      ro: {
        slug: 'cv-pentru-retail-si-vanzari-in-magazin',
        title: 'CV pentru retail și vânzări în magazin',
        description: 'Cum scrii un CV pentru joburi în retail: vânzări, relația cu clienții, casă de marcat, rezultate și lucru în echipă.',
        answer:
          'Un CV de retail pune în față experiența cu clienții, vânzările și gestionarea mărfii, cu cifre: valoarea vânzărilor, clienți serviți, targeturi atinse, pierderi reduse. Menționează sistemele de casă și inventar și programul pe care îl poți lucra. O pagină este suficientă pentru majoritatea posturilor.',
        sections: [
          {
            heading: 'Ce arăt în prim-plan?',
            paragraphs: [
              'Experiența cu clienții și rezultatele: targeturi, vânzări suplimentare, reclamații rezolvate. Retailul se judecă după fiabilitate și vânzări, deci cifrele ajută mult.',
            ],
          },
          {
            heading: 'Cum scriu punctele de experiență?',
            paragraphs: [
              'Exemplu ilustrativ: „Am depășit targetul lunar cu 9% într-un magazin cu 11 angajați, prin recomandări personalizate și vânzare de produse complementare.” Adaugă mărimea magazinului și categoria de produse.',
            ],
          },
          {
            heading: 'Ce competențe pun?',
            paragraphs: ['Competențe căutate în magazine:'],
            items: [
              'Casă de marcat și sisteme POS, inventariere.',
              'Merchandising și aranjarea raftului.',
              'Gestionarea clienților dificili și a reclamațiilor.',
              'Limbi străine pentru magazinele din zone turistice.',
            ],
          },
          {
            heading: 'Cum arăt potențialul de creștere?',
            paragraphs: [
              'Menționează instruirea colegilor noi, preluarea de responsabilități (deschidere, închidere, inventar) și promovările. Angajatorii caută persoane care pot ajunge responsabili de tură.',
            ],
          },
        ],
        faq: [
          {
            question: 'Cum aplic fără experiență în retail?',
            answer: 'Folosește experiența cu clienții din alte domenii, voluntariatul sau joburile de vară și arată disponibilitatea de program.',
          },
          {
            question: 'Ce fac cu joburile de scurtă durată?',
            answer: 'Păstrează-le dacă sunt relevante, grupează-le sub „Alte experiențe” și arată un rezultat pentru fiecare.',
          },
          {
            question: 'Trebuie să scriu salariul dorit?',
            answer: 'Doar dacă anunțul o cere. Altfel îl discuți la interviu.',
          },
        ],
      },
      en: {
        slug: 'retail-resume',
        title: 'Resume for retail and in-store sales',
        description: 'How to write a resume for retail jobs: sales, customer relations, point of sale, results and teamwork.',
        answer:
          'A retail resume puts customer experience, sales and merchandise handling up front, with figures: sales value, customers served, targets reached, shrinkage reduced. Mention POS and inventory systems and the schedule you can work. One page is enough for most roles.',
        sections: [
          {
            heading: 'What do I show up front?',
            paragraphs: [
              'Customer experience and results: targets, upsells, complaints resolved. Retail is judged on reliability and sales, so figures help a lot.',
            ],
          },
          {
            heading: 'How do I write experience bullets?',
            paragraphs: [
              'Illustrative example: "Beat the monthly target by 9% in a store with 11 employees through personalized recommendations and complementary product sales." Add the store size and product category.',
            ],
          },
          {
            heading: 'Which skills do I list?',
            paragraphs: ['Skills stores look for:'],
            items: [
              'Cash register and POS systems, stock counts.',
              'Merchandising and shelf layout.',
              'Handling difficult customers and complaints.',
              'Foreign languages for stores in tourist areas.',
            ],
          },
          {
            heading: 'How do I show growth potential?',
            paragraphs: [
              'Mention training new colleagues, taking on responsibilities (opening, closing, inventory) and promotions. Employers look for people who can become shift leads.',
            ],
          },
        ],
        faq: [
          {
            question: 'How do I apply without retail experience?',
            answer: 'Use customer experience from other fields, volunteering or summer jobs and show your schedule availability.',
          },
          {
            question: 'What do I do with short-term jobs?',
            answer: 'Keep them if relevant, group them under "Other experience" and show one result for each.',
          },
          {
            question: 'Do I write my desired salary?',
            answer: 'Only if the posting asks for it. Otherwise discuss it at the interview.',
          },
        ],
      },
    },
  },
  {
    datePublished: DATE,
    dateModified: DATE,
    content: {
      ro: {
        slug: 'cv-pentru-constructii-si-meserii',
        title: 'CV pentru construcții și meserii',
        description: 'Cum scrii un CV pentru joburi în construcții și meserii: atestate, șantiere, echipamente, siguranța muncii și rezultate.',
        answer:
          'Un CV pentru construcții și meserii pune în față meseria, atestatele și autorizările, apoi șantierele la care ai lucrat, cu tip, dimensiune și rolul tău. Menționează utilajele și uneltele folosite, respectarea normelor de siguranță și lipsa accidentelor. O pagină, clară, cu telefonul scris în corpul paginii, este suficientă.',
        sections: [
          {
            heading: 'Ce pun primul?',
            paragraphs: [
              'Meseria sau rolul (zidar, instalator, electrician, șef de echipă, inginer constructor), anii de experiență și atestatele cerute. Angajatorii verifică întâi calificarea.',
            ],
          },
          {
            heading: 'Cum descriu șantierele?',
            paragraphs: [
              'Pentru fiecare: tipul lucrării (rezidențial, industrial, drumuri), dimensiunea (suprafață, număr de apartamente), rolul tău și rezultatul. Exemplu ilustrativ: „Am executat instalațiile sanitare a 40 de apartamente într-un bloc nou, cu predare la termen și fără reluări la recepție.”',
            ],
          },
          {
            heading: 'Ce echipamente și norme menționez?',
            paragraphs: ['Elemente de siguranță și competență:'],
            items: [
              'Utilaje și scule folosite (excavator, schele, aparate de sudură).',
              'Norme de securitate și sănătate în muncă și instruiri făcute.',
              'Citirea planurilor și a documentației tehnice.',
              'Conducerea unei echipe, dacă ai făcut-o.',
            ],
          },
          {
            heading: 'Ce greșeli evit?',
            paragraphs: [
              'Omiterea atestatelor, lipsa datelor de contact clare și descrieri fără dimensiune sau rezultat. Menționează și disponibilitatea pentru deplasări, dacă e cazul.',
            ],
          },
        ],
        faq: [
          {
            question: 'Cum arăt experiența din străinătate?',
            answer: 'Cu țara, perioada și tipul lucrărilor. Dacă ai lucrat într-o echipă internațională, menționează limbile folosite.',
          },
          {
            question: 'Trebuie să am poză în CV?',
            answer: 'Este opțional. Contează mai mult atestatele și experiența.',
          },
          {
            question: 'Cum trec de la muncitor la șef de echipă?',
            answer: 'Pune în față responsabilitățile de coordonare, instruirea colegilor și rezultatele echipei.',
          },
        ],
      },
      en: {
        slug: 'construction-and-trades-resume',
        title: 'Resume for construction and trades',
        description: 'How to write a resume for construction and trades jobs: certificates, sites, equipment, workplace safety and results.',
        answer:
          'A construction and trades resume puts your trade, certificates and authorizations up front, then the sites you worked on, with type, size and your role. Mention the machinery and tools used, safety compliance and a clean accident record. One clear page, with your phone number written in the body of the page, is enough.',
        sections: [
          {
            heading: 'What goes first?',
            paragraphs: [
              'Your trade or role (bricklayer, plumber, electrician, foreman, site engineer), years of experience and required certificates. Employers check qualification first.',
            ],
          },
          {
            heading: 'How do I describe sites?',
            paragraphs: [
              'For each: the type of work (residential, industrial, roads), the size (area, number of apartments), your role and the result. Illustrative example: "Carried out the plumbing for 40 apartments in a new building, delivered on time with no rework at handover."',
            ],
          },
          {
            heading: 'Which equipment and standards do I mention?',
            paragraphs: ['Safety and competence elements:'],
            items: [
              'Machinery and tools used (excavator, scaffolding, welding equipment).',
              'Occupational health and safety rules and training completed.',
              'Reading plans and technical documentation.',
              'Leading a crew, if you have.',
            ],
          },
          {
            heading: 'What mistakes do I avoid?',
            paragraphs: [
              'Leaving out certificates, missing clear contact details and descriptions without size or result. Also mention availability for travel, where relevant.',
            ],
          },
        ],
        faq: [
          {
            question: 'How do I show experience abroad?',
            answer: 'With the country, dates and type of work. If you worked in an international crew, mention the languages used.',
          },
          {
            question: 'Do I need a photo on the resume?',
            answer: 'It is optional. Certificates and experience count for more.',
          },
          {
            question: 'How do I move from worker to foreman?',
            answer: 'Put coordination responsibilities, training of colleagues and team results up front.',
          },
        ],
      },
    },
  },
  {
    datePublished: DATE,
    dateModified: DATE,
    content: {
      ro: {
        slug: 'cv-pentru-profesori-si-educatie',
        title: 'CV pentru profesori și joburi în educație',
        description: 'Cum scrii un CV pentru educație: studii, discipline predate, rezultate ale elevilor, metode, formări și proiecte extrașcolare.',
        answer:
          'Un CV pentru educație pune în față studiile, disciplinele predate și gradul didactic, apoi rezultatele: promovabilitate, participări la olimpiade, proiecte, metode folosite. Menționează formările continue și competențele digitale. Folosește cifre reale despre elevi, fără date care îi identifică.',
        sections: [
          {
            heading: 'Ce pun primul?',
            paragraphs: [
              'Disciplinele și nivelul la care predai, gradul didactic și studiile de specialitate. Rezumatul spune în două propoziții stilul tău de predare și experiența.',
            ],
          },
          {
            heading: 'Cum arăt rezultatele?',
            paragraphs: [
              'Exemplu ilustrativ: „Am predat matematica la clasele V-VIII, cu o promovabilitate de 96% la evaluarea națională la clasa pregătită de mine și 7 elevi calificați la faza județeană a olimpiadei.”',
              'Nu include nume de elevi. Folosește procente și numere agregate.',
            ],
          },
          {
            heading: 'Ce formări și competențe adaug?',
            paragraphs: ['Elemente căutate în educație:'],
            items: [
              'Cursuri de formare continuă și credite profesionale.',
              'Platforme digitale folosite la clasă (Google Classroom, Moodle, Kahoot).',
              'Proiecte extrașcolare, cercuri, tabere, voluntariat.',
              'Limbi străine și experiență cu elevi cu cerințe educaționale speciale.',
            ],
          },
          {
            heading: 'Ce greșeli evit?',
            paragraphs: [
              'Descrieri generale („am predat la clasă”) fără disciplină, nivel și rezultate. Un CV care arată metodele și realizările elevilor se detașează.',
            ],
          },
        ],
        faq: [
          {
            question: 'Cum aplic la o școală privată sau internațională?',
            answer: 'Adaptează CV-ul la curriculum (de exemplu Cambridge sau IB), limba de predare și experiența cu elevi străini.',
          },
          {
            question: 'Pun scrisoare de intenție?',
            answer: 'Da, este utilă pentru a arăta viziunea ta pedagogică și motivația pentru instituția respectivă.',
          },
          {
            question: 'Cum prezint un portofoliu didactic?',
            answer: 'Cu un link către materiale, lecții sau proiecte, scris ca text în antetul CV-ului.',
          },
        ],
      },
      en: {
        slug: 'teacher-and-education-resume',
        title: 'Resume for teachers and education jobs',
        description: 'How to write an education resume: studies, subjects taught, student results, methods, training and extracurricular projects.',
        answer:
          'An education resume puts your studies, the subjects you teach and your teaching grade up front, then results: pass rates, competition entries, projects, methods used. Mention continuing training and digital skills. Use real figures about students without any data that identifies them.',
        sections: [
          {
            heading: 'What goes first?',
            paragraphs: [
              'The subjects and level you teach, your teaching grade and your subject studies. The summary states your teaching style and experience in two sentences.',
            ],
          },
          {
            heading: 'How do I show results?',
            paragraphs: [
              'Illustrative example: "Taught mathematics to grades 5 to 8, with a 96% pass rate on the national assessment in the class I prepared and 7 students qualified for the county round of the olympiad."',
              'Do not include student names. Use percentages and aggregate numbers.',
            ],
          },
          {
            heading: 'Which training and skills do I add?',
            paragraphs: ['Elements sought in education:'],
            items: [
              'Continuing training courses and professional credits.',
              'Digital platforms used in class (Google Classroom, Moodle, Kahoot).',
              'Extracurricular projects, clubs, camps, volunteering.',
              'Foreign languages and experience with students with special educational needs.',
            ],
          },
          {
            heading: 'What mistakes do I avoid?',
            paragraphs: [
              'General descriptions ("taught in class") without subject, level and results. A resume that shows methods and student achievements stands out.',
            ],
          },
        ],
        faq: [
          {
            question: 'How do I apply to a private or international school?',
            answer: 'Tailor the resume to the curriculum (for example Cambridge or IB), the language of instruction and experience with international students.',
          },
          {
            question: 'Do I add a cover letter?',
            answer: 'Yes, it helps show your teaching philosophy and your motivation for the institution.',
          },
          {
            question: 'How do I present a teaching portfolio?',
            answer: 'With a link to materials, lessons or projects, written as text in the resume header.',
          },
        ],
      },
    },
  },
  {
    datePublished: DATE,
    dateModified: DATE,
    content: {
      ro: {
        slug: 'tipuri-de-intrebari-la-interviu',
        title: 'Tipuri de întrebări la interviu și cum răspunzi',
        description: 'Tipurile principale de întrebări la interviu (comportamentale, tehnice, situaționale, motivaționale) și structura unui răspuns bun.',
        answer:
          'La interviu întâlnești patru tipuri de întrebări: comportamentale (despre trecut), situaționale (ipoteze), tehnice (competențe) și motivaționale (de ce tu, de ce noi). Pentru primele două folosește structura situație, sarcină, acțiune, rezultat, iar pentru ultimele pregătește exemple concrete și informații despre firmă.',
        sections: [
          {
            heading: 'Ce sunt întrebările comportamentale?',
            paragraphs: [
              'Cer exemple din trecut: „Povestește-mi despre o situație în care ai gestionat un conflict.” Folosește schema STAR: contextul, sarcina ta, ce ai făcut și rezultatul, cu un număr dacă există.',
            ],
          },
          {
            heading: 'Cum răspund la întrebările situaționale?',
            paragraphs: [
              'Cer o ipoteză: „Ce ai face dacă un client e nemulțumit de livrare?” Descrie pașii logici, prioritățile și cum comunici, apoi leagă răspunsul de un exemplu real, dacă ai.',
            ],
          },
          {
            heading: 'Ce urmăresc întrebările tehnice?',
            paragraphs: [
              'Verifică competențele cerute de post. Răspunde onest, structurat și spune când nu știi ceva, apoi arată cum ai căuta soluția. Pregătește exemple concrete cu uneltele din anunț.',
            ],
          },
          {
            heading: 'Cum abordez întrebările motivaționale?',
            paragraphs: [
              'Informează-te despre firmă, produs și echipă și leagă motivația ta de ele. Evită răspunsurile generale; arată ce te atrage concret și ce poți aduce.',
            ],
            items: [
              '„De ce vrei să lucrezi aici?” Răspunde cu ceva specific firmei.',
              '„Unde te vezi în 5 ani?” Arată dorința de dezvoltare în direcția rolului.',
              '„Care sunt punctele tale slabe?” Alege unul real, cu ce faci ca să îl îmbunătățești.',
            ],
          },
        ],
        faq: [
          {
            question: 'Cum mă pregătesc eficient?',
            answer: 'Alege 5-6 exemple din experiență, exersează-le cu voce tare și cercetează firma și anunțul.',
          },
          {
            question: 'Ce fac dacă nu știu răspunsul?',
            answer: 'Spune onest că nu știi, descrie cum ai afla și revino la ce știi. Onestitatea ajută.',
          },
          {
            question: 'Pot pune și eu întrebări?',
            answer: 'Da, și ar trebui. Pregătește 2-3 întrebări despre echipă, obiective și primele 90 de zile.',
          },
        ],
      },
      en: {
        slug: 'types-of-interview-questions',
        title: 'Types of interview questions and how to answer',
        description: 'The main types of interview questions (behavioral, technical, situational, motivational) and the structure of a good answer.',
        answer:
          'In an interview you meet four types of questions: behavioral (about the past), situational (hypotheticals), technical (skills) and motivational (why you, why us). For the first two use the situation, task, action, result structure, and for the last prepare concrete examples and information about the company.',
        sections: [
          {
            heading: 'What are behavioral questions?',
            paragraphs: [
              'They ask for examples from the past: "Tell me about a time you handled a conflict." Use the STAR scheme: the context, your task, what you did and the result, with a number if there is one.',
            ],
          },
          {
            heading: 'How do I answer situational questions?',
            paragraphs: [
              'They ask for a hypothetical: "What would you do if a client is unhappy with a delivery?" Describe the logical steps, the priorities and how you communicate, then tie the answer to a real example if you have one.',
            ],
          },
          {
            heading: 'What do technical questions look for?',
            paragraphs: [
              'They check the skills the role requires. Answer honestly and in a structured way, say when you do not know something, then show how you would find the solution. Prepare concrete examples with the tools in the posting.',
            ],
          },
          {
            heading: 'How do I approach motivational questions?',
            paragraphs: [
              'Learn about the company, product and team and tie your motivation to them. Avoid general answers; show what attracts you concretely and what you can bring.',
            ],
            items: [
              '"Why do you want to work here?" Answer with something specific to the company.',
              '"Where do you see yourself in 5 years?" Show a wish to grow in the direction of the role.',
              '"What are your weaknesses?" Pick a real one, with what you do to improve it.',
            ],
          },
        ],
        faq: [
          {
            question: 'How do I prepare efficiently?',
            answer: 'Pick 5 or 6 examples from your experience, practice them aloud and research the company and the posting.',
          },
          {
            question: 'What if I do not know the answer?',
            answer: 'Say honestly that you do not know, describe how you would find out and return to what you do know. Honesty helps.',
          },
          {
            question: 'Can I ask questions too?',
            answer: 'Yes, and you should. Prepare 2 or 3 questions about the team, goals and the first 90 days.',
          },
        ],
      },
    },
  },
  {
    datePublished: DATE,
    dateModified: DATE,
    content: {
      ro: {
        slug: 'cv-in-limba-germana-lebenslauf',
        title: 'CV în germană (Lebenslauf): ce trebuie să știi',
        description: 'Cum adaptezi CV-ul pentru piețele germanofone: structură, practici locale, limbă, scrisoare de intenție și diferențe față de CV-ul românesc.',
        answer:
          'Pentru piețele germanofone, CV-ul (Lebenslauf) este de obicei scris în limba anunțului, în ordine cronologică inversă, concis și clar, cu rubrici standard. Practicile privind poza și datele personale diferă și se schimbă, deci verifică ghidurile actuale ale țării și ale companiei. Cere unui vorbitor nativ să citească textul înainte de trimitere.',
        sections: [
          {
            heading: 'Cum arată structura?',
            paragraphs: [
              'De obicei: date de contact, experiență profesională (de la cea mai recentă), educație, competențe și limbi, cu perioade exacte și rolul. Scrie clar și direct, fără propoziții lungi.',
            ],
          },
          {
            heading: 'Ce diferă față de CV-ul românesc?',
            paragraphs: [
              'Piețele germanofone pun accent pe documente complete și pe corectitudinea limbii. Practici precum poza, data nașterii sau lista de referințe diferă de la o companie la alta și se pot schimba, deci confirmă din anunț și din surse oficiale actuale.',
            ],
          },
          {
            heading: 'Ce limbă și ce nivel scriu?',
            paragraphs: [
              'Scrie CV-ul în germană dacă anunțul este în germană, altfel în engleză, dacă este acceptată. Pune nivelul de germană cu scara europeană (B2, C1) și certificatul, dacă ai (Goethe, TestDaF).',
            ],
          },
          {
            heading: 'Cum tratez scrisoarea și documentele?',
            paragraphs: [
              'Multe companii cer scrisoare de intenție (Anschreiben) și, uneori, copii ale diplomelor sau ale certificatelor de la angajatori. Verifică în anunț ce documente se cer și traducerile necesare.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pot folosi același CV pentru Germania, Austria și Elveția?',
            answer: 'Baza poate fi aceeași, dar verifică particularitățile fiecărei țări și ale companiei.',
          },
          {
            question: 'Trebuie să traduc diplomele?',
            answer: 'Depinde de angajator și de profesie. Pentru profesii reglementate, procedura de recunoaștere este oficială.',
          },
          {
            question: 'Cum exersez limba pentru interviu?',
            answer: 'Cu un partener vorbitor nativ sau cu un curs orientat spre limba de lucru din domeniul tău.',
          },
        ],
      },
      en: {
        slug: 'german-resume-lebenslauf',
        title: 'German-language resume (Lebenslauf): what to know',
        description: 'How to adapt your resume for German-speaking markets: structure, local practice, language, cover letter and differences from a Romanian CV.',
        answer:
          'For German-speaking markets, the resume (Lebenslauf) is usually written in the language of the posting, in reverse chronological order, concise and clear, with standard headings. Practices around photos and personal data differ and change, so check the current guidance for the country and the company. Have a native speaker read the text before sending.',
        sections: [
          {
            heading: 'What does the structure look like?',
            paragraphs: [
              'Usually: contact details, professional experience (most recent first), education, skills and languages, with exact dates and your role. Write clearly and directly, without long sentences.',
            ],
          },
          {
            heading: 'What differs from a Romanian CV?',
            paragraphs: [
              'German-speaking markets put weight on complete documents and correct language. Practices such as a photo, date of birth or a reference list differ between companies and can change, so confirm from the posting and from current official sources.',
            ],
          },
          {
            heading: 'Which language and level do I write?',
            paragraphs: [
              'Write the resume in German if the posting is in German, otherwise in English if it is accepted. State your German level on the European scale (B2, C1) and the certificate, if you have one (Goethe, TestDaF).',
            ],
          },
          {
            heading: 'How do I handle the letter and documents?',
            paragraphs: [
              'Many companies ask for a cover letter (Anschreiben) and sometimes copies of diplomas or employer references. Check the posting for the documents required and the translations needed.',
            ],
          },
        ],
        faq: [
          {
            question: 'Can I use the same resume for Germany, Austria and Switzerland?',
            answer: 'The base can be the same, but check the specifics of each country and company.',
          },
          {
            question: 'Do I need to translate diplomas?',
            answer: 'It depends on the employer and the profession. For regulated professions, the recognition procedure is official.',
          },
          {
            question: 'How do I practice the language for the interview?',
            answer: 'With a native speaker partner or a course focused on the working language of your field.',
          },
        ],
      },
    },
  },
]
