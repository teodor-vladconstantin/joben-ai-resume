// Guides 2-5. See guides.ts for the model. Copy rules: no em dashes, no "X, not Y" phrasing.
import type { Guide } from './guides'
import { MORE_GUIDES_B } from './guides-more-b'

const A: Guide[] = [
  {
    datePublished: '2026-10-16',
    dateModified: '2026-10-16',
    content: {
      ro: {
        slug: 'cv-fara-experienta',
        title: 'Cum scrii un CV fără experiență de muncă',
        description:
          'Cum scrii un CV când nu ai încă experiență: ce secțiuni pui primele, ce proiecte și voluntariat contează și cum arată un rezumat convingător.',
        answer:
          'Un CV fără experiență de muncă se construiește pe ce ai deja: educația, proiectele, voluntariatul, practica și competențele demonstrabile. Pune educația și proiectele înaintea experienței, descrie fiecare proiect cu un rezultat concret și reia în CV cuvintele din anunț. O pagină este suficientă.',
        sections: [
          {
            heading: 'Ce pun primul într-un CV fără experiență?',
            paragraphs: [
              'Recrutorul caută dovezi că poți face munca. Când nu ai un post anterior, dovezile vin din altă parte: studii relevante, proiecte, practică, voluntariat, cursuri și certificări.',
              'Ordinea recomandată este: date de contact, rezumat de două-trei rânduri, educație, proiecte sau practică, competențe, limbi străine. Experiența de muncă fără legătură cu postul (un job de vară, de exemplu) intră mai jos, într-o secțiune scurtă.',
            ],
          },
          {
            heading: 'Ce proiecte și activități contează?',
            paragraphs: [
              'Orice activitate în care ai livrat ceva contează: o lucrare de licență, un proiect de echipă la facultate, un magazin online făcut pentru o rudă, un eveniment organizat într-un ONG, un canal de social media pe care l-ai crescut.',
              'Pentru fiecare, scrie ce ai făcut, cu ce unelte și ce rezultat a ieșit. Un număr (participanți, vizitatori, ore economisite) face un punct mult mai ușor de crezut.',
            ],
            items: [
              'Exemplu ilustrativ, punct slab: „Am participat la un proiect de marketing.”',
              'Exemplu ilustrativ, punct puternic: „Am gestionat contul de Instagram al unui ONG local timp de 6 luni și am crescut numărul de urmăritori de la 300 la 1.100.”',
            ],
          },
          {
            heading: 'Cum scriu rezumatul când nu am experiență?',
            paragraphs: [
              'Rezumatul are două-trei propoziții: cine ești profesional, ce competențe aduci și ce post urmărești. Folosește formularea din anunț pentru titlul postului și pentru două competențe cheie.',
              'Exemplu ilustrativ: „Absolvent de Informatică, cu proiecte în React și Node.js și o aplicație publicată cu peste 200 de utilizatori. Caut un post de dezvoltator junior într-o echipă care lucrează cu TypeScript.”',
            ],
          },
          {
            heading: 'Ce greșeli evit?',
            paragraphs: [
              'Cea mai frecventă greșeală este umplutura: obiective generale, liste lungi de calități fără exemple și cursuri care nu au legătură cu postul. Alege puține elemente, relevante, și descrie-le concret.',
              'A doua greșeală este un format care încurcă ATS-ul: coloane, tabele și bare de nivel pentru competențe. Un CV simplu, pe o singură coloană, se citește corect și de oameni, și de programe.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pot trece voluntariatul la experiență?',
            answer:
              'Da, dacă l-ai făcut cu responsabilități clare. Pune-l într-o secțiune de voluntariat sau în experiență, cu organizația, perioada și rezultatele concrete.',
          },
          {
            question: 'Cât de lung este un CV fără experiență?',
            answer: 'O pagină. Fără experiență îndelungată, a doua pagină aduce de obicei text de umplutură.',
          },
          {
            question: 'Merită să includ hobby-uri?',
            answer:
              'Doar dacă au legătură cu postul sau arată o calitate cerută, de exemplu un hobby care presupune organizare de echipe. Altfel, spațiul se folosește mai bine pentru proiecte.',
          },
        ],
      },
      en: {
        slug: 'resume-with-no-experience',
        title: 'How to write a resume with no work experience',
        description:
          'How to write a resume when you have no work history yet: which sections come first, which projects and volunteering count, and a convincing summary.',
        answer:
          'A resume with no work experience is built on what you already have: education, projects, volunteering, internships and skills you can demonstrate. Put education and projects before experience, describe each project with a concrete result and reuse the wording of the job posting. One page is enough.',
        sections: [
          {
            heading: 'What goes first on a resume with no experience?',
            paragraphs: [
              'A recruiter looks for proof that you can do the work. Without a previous job, the proof comes from elsewhere: relevant studies, projects, internships, volunteering, courses and certifications.',
              'The recommended order is contact details, a two or three line summary, education, projects or internship, skills, languages. Work experience unrelated to the role (a summer job, for example) goes lower, in a short section.',
            ],
          },
          {
            heading: 'Which projects and activities count?',
            paragraphs: [
              'Any activity where you delivered something counts: a thesis, a team project at university, an online shop you built for a relative, an event you organized for a nonprofit, a social media channel you grew.',
              'For each one, write what you did, with which tools and what came out of it. A number (participants, visitors, hours saved) makes a bullet far easier to believe.',
            ],
            items: [
              'Illustrative example, weak bullet: "Took part in a marketing project."',
              'Illustrative example, strong bullet: "Ran a local nonprofit\'s Instagram account for 6 months and grew followers from 300 to 1,100."',
            ],
          },
          {
            heading: 'How do I write the summary without experience?',
            paragraphs: [
              'The summary has two or three sentences: who you are professionally, which skills you bring and which role you are after. Use the posting\'s wording for the job title and for two key skills.',
              'Illustrative example: "Computer Science graduate with React and Node.js projects and a published app with over 200 users. Looking for a junior developer role on a team that works with TypeScript."',
            ],
          },
          {
            heading: 'Which mistakes should I avoid?',
            paragraphs: [
              'The most common mistake is filler: generic objectives, long lists of qualities without examples and courses unrelated to the role. Pick a few relevant items and describe them concretely.',
              'The second is a format that trips up ATS software: columns, tables and skill-level bars. A plain single-column resume reads correctly for people and for programs alike.',
            ],
          },
        ],
        faq: [
          {
            question: 'Can I list volunteering as experience?',
            answer:
              'Yes, if you held clear responsibilities. Put it in a volunteering section or under experience, with the organization, the dates and concrete results.',
          },
          {
            question: 'How long should a resume with no experience be?',
            answer: 'One page. Without a long work history, a second page usually adds filler.',
          },
          {
            question: 'Should I include hobbies?',
            answer:
              'Only when they relate to the role or show a requested quality, for example a hobby that involves organizing teams. Otherwise the space is better spent on projects.',
          },
        ],
      },
    },
  },
  {
    datePublished: '2026-10-16',
    dateModified: '2026-10-16',
    content: {
      ro: {
        slug: 'cv-europass-sau-modern',
        title: 'CV Europass sau CV modern: pe care îl aleg?',
        description:
          'Diferențele dintre CV-ul Europass și un CV modern pe o coloană: când se cere fiecare, ce spun ATS-urile și cum alegi pentru postul tău.',
        answer:
          'Folosește CV-ul Europass când anunțul sau instituția îl cer explicit, de exemplu la proiecte europene, concursuri publice sau burse. Pentru candidaturi în companii private, un CV modern, pe o singură coloană, cu text real, este de obicei alegerea mai bună, pentru că se citește ușor și de recrutor, și de ATS.',
        sections: [
          {
            heading: 'Ce este CV-ul Europass?',
            paragraphs: [
              'Europass este un format de CV standardizat la nivel european, pe care îl completezi într-un instrument online oficial. Scopul lui este ca informațiile despre studii, experiență și competențe să arate la fel în toate statele membre.',
              'Formatul are secțiuni fixe și un aspect predefinit. Avantajul este recunoașterea: o instituție care îl cere știe unde să caute fiecare informație.',
            ],
          },
          {
            heading: 'Când se cere Europass?',
            paragraphs: [
              'Îl vei întâlni în concursuri pentru posturi publice, în proiecte cu finanțare europeană, la burse și mobilități Erasmus și la unele universități. Citește mereu cerința din anunț: dacă scrie „CV în format Europass”, folosește-l.',
              'Dacă anunțul nu pomenește formatul, ai libertatea să alegi. Multe companii private primesc bine ambele variante.',
            ],
          },
          {
            heading: 'De ce aleg un CV modern pentru companii private?',
            paragraphs: [
              'Un CV modern îți lasă controlul asupra accentelor: poți urca în față realizările, poți scurta secțiunile mai puțin relevante și poți adapta rezumatul fiecărui post.',
              'Pe o singură coloană, cu titluri standard și text selectabil, el rămâne curat și pentru parserele ATS. Verifică întotdeauna exportul final: copiază textul din PDF într-un editor simplu și vezi dacă ordinea este cea corectă.',
            ],
          },
          {
            heading: 'Pot folosi ambele?',
            paragraphs: [
              'Da. Păstrează un CV modern ca versiune de bază și generează o versiune Europass doar pentru anunțurile care o cer. Conținutul este același, iar forma se schimbă.',
            ],
          },
        ],
        faq: [
          {
            question: 'Este Europass citit corect de ATS?',
            answer:
              'Depinde de fișierul exportat și de sistem. Verifică PDF-ul copiind textul într-un editor simplu: dacă secțiunile apar în ordinea corectă, un parser le va citi la fel.',
          },
          {
            question: 'Europass este gratuit?',
            answer: 'Instrumentul oficial Europass este gratuit. Verifică pe site-ul oficial condițiile curente, pentru că platforma se actualizează.',
          },
          {
            question: 'Câte pagini are un CV Europass?',
            answer: 'Lungimea depinde de conținut. Ca regulă practică, ține-l la două pagini și scoate informațiile fără legătură cu postul.',
          },
        ],
      },
      en: {
        slug: 'europass-or-modern-resume',
        title: 'Europass CV or a modern resume: which to pick?',
        description:
          'The differences between a Europass CV and a modern single-column resume: when each is requested, what ATS software does with them and how to choose.',
        answer:
          'Use the Europass CV when the posting or the institution asks for it, for example for EU projects, public-sector competitions or scholarships. For applications to private companies, a modern single-column resume with real text is usually the better choice, since both recruiters and ATS software read it easily.',
        sections: [
          {
            heading: 'What is the Europass CV?',
            paragraphs: [
              'Europass is a standardized European CV format that you fill in with an official online tool. Its purpose is for studies, experience and skills to look the same across member states.',
              'The format has fixed sections and a predefined look. The advantage is recognition: an institution that asks for it knows where to find each piece of information.',
            ],
          },
          {
            heading: 'When is Europass requested?',
            paragraphs: [
              'You will meet it in public-sector competitions, EU-funded projects, scholarships, Erasmus mobility and at some universities. Always read the requirement in the posting: if it says "CV in Europass format", use it.',
              'If the posting does not mention a format, the choice is yours. Many private companies accept both.',
            ],
          },
          {
            heading: 'Why pick a modern resume for private companies?',
            paragraphs: [
              'A modern resume leaves you in control of emphasis: you can move achievements up front, shorten less relevant sections and tailor the summary to each role.',
              'On a single column, with standard headings and selectable text, it stays clean for ATS parsers too. Always check the final export: paste the text from the PDF into a plain editor and see whether the order is right.',
            ],
          },
          {
            heading: 'Can I use both?',
            paragraphs: [
              'Yes. Keep a modern resume as your base version and generate a Europass version only for the postings that ask for it. The content is the same and the form changes.',
            ],
          },
        ],
        faq: [
          {
            question: 'Does ATS software read Europass correctly?',
            answer:
              'It depends on the exported file and the system. Check the PDF by pasting its text into a plain editor: if the sections appear in the right order, a parser will read them the same way.',
          },
          {
            question: 'Is Europass free?',
            answer: 'The official Europass tool is free. Check the official site for current conditions, since the platform is updated.',
          },
          {
            question: 'How many pages is a Europass CV?',
            answer: 'The length depends on the content. As a practical rule, keep it to two pages and drop information unrelated to the role.',
          },
        ],
      },
    },
  },
  {
    datePublished: '2026-10-16',
    dateModified: '2026-10-16',
    content: {
      ro: {
        slug: 'cv-in-engleza-pentru-job-in-strainatate',
        title: 'CV în engleză pentru un job în străinătate',
        description:
          'Cum adaptezi un CV românesc pentru piețele străine: traducerea titlurilor, formatul datelor, poza, datele personale și greșelile frecvente.',
        answer:
          'Un CV în engleză pentru străinătate se scrie ca un resume: fără poză, fără data nașterii și fără stare civilă, cu rezultate cuantificate, titluri standard de secțiuni și verbe de acțiune. Nu traduce cuvânt cu cuvânt CV-ul românesc. Rescrie punctele ca realizări și verifică cerințele fiecărei țări.',
        sections: [
          {
            heading: 'Ce diferă între un CV românesc și un resume englezesc?',
            paragraphs: [
              'În multe țări vorbitoare de engleză, recrutorul se așteaptă la un document axat pe realizări. Informațiile personale precum poza, data nașterii și starea civilă lipsesc de obicei, iar accentul cade pe experiență și rezultate.',
              'Obiceiurile variază de la o țară la alta. Pentru Marea Britanie, Irlanda, SUA sau Canada există ghiduri locale, iar pentru țările din Europa continentală poți găsi practici diferite. Citește anunțul și site-ul companiei.',
            ],
          },
          {
            heading: 'Cum traduc titlurile de secțiuni?',
            paragraphs: [
              'Folosește titluri standard, pe care le recunosc și oamenii, și ATS-urile.',
            ],
            items: [
              'Experiență profesională: Work Experience sau Professional Experience',
              'Educație: Education',
              'Competențe: Skills',
              'Limbi străine: Languages',
              'Certificări: Certifications',
              'Rezumat: Summary sau Professional Summary',
            ],
          },
          {
            heading: 'Cum scriu punctele de la experiență?',
            paragraphs: [
              'Începe fiecare punct cu un verb de acțiune la trecut (Led, Built, Reduced, Launched) și încheie-l cu un rezultat. Evită formulările pasive de tipul „Responsible for”.',
              'Convertește valorile: pune sumele în moneda relevantă pentru piața țintă și formatul datelor în stilul local, de exemplu 03/2022 - 09/2024 sau Mar 2022 - Sep 2024, consecvent în tot documentul.',
            ],
          },
          {
            heading: 'Ce fac cu nivelul de limbă și cu diplomele?',
            paragraphs: [
              'Scrie nivelul de engleză cu scara europeană (B2, C1) sau cu un cuvânt clar, de exemplu „Fluent”, și menționează certificările dacă le ai (IELTS, TOEFL, Cambridge).',
              'Explică pe scurt diplomele românești dacă numele lor nu spune nimic în afara țării, de exemplu „Licență în Informatică (Bachelor of Science in Computer Science)”.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pun poză în CV-ul în engleză?',
            answer:
              'În multe țări anglofone nu se obișnuiește poza. Dacă aplici într-o țară unde se practică, urmează uzanța locală și anunțul.',
          },
          {
            question: 'Trebuie să traduc numele companiilor românești?',
            answer:
              'Nu. Păstrează numele oficial și adaugă pe scurt domeniul dacă firma nu este cunoscută, de exemplu „Companie românească de logistică”.',
          },
          {
            question: 'Cum arăt un salariu sau un nivel de responsabilitate?',
            answer:
              'Salariul nu se trece în CV decât dacă anunțul îl cere. Nivelul de responsabilitate se arată prin dimensiunea echipei, bugetului sau a volumului gestionat.',
          },
        ],
      },
      en: {
        slug: 'resume-for-jobs-abroad',
        title: 'How to adapt a Romanian CV for jobs abroad',
        description:
          'How to adapt a Romanian CV for foreign job markets: translating headings, date formats, photo, personal data and the mistakes to avoid.',
        answer:
          'A resume for jobs abroad is written as an achievement document: no photo, no date of birth and no marital status, with quantified results, standard section headings and action verbs. Rewrite the bullets as accomplishments and check each country\'s expectations.',
        sections: [
          {
            heading: 'How does a Romanian CV differ from an English-language resume?',
            paragraphs: [
              'In many English-speaking countries the recruiter expects an achievement-focused document. Personal details such as a photo, date of birth and marital status are usually left out, and the emphasis falls on experience and results.',
              'Habits vary by country. The UK, Ireland, the US and Canada each have local guidance, and continental European countries can differ again. Read the posting and the company site.',
            ],
          },
          {
            heading: 'How do I translate the section headings?',
            paragraphs: ['Use standard headings that both people and ATS software recognize.'],
            items: [
              'Experiență profesională: Work Experience or Professional Experience',
              'Educație: Education',
              'Competențe: Skills',
              'Limbi străine: Languages',
              'Certificări: Certifications',
              'Rezumat: Summary or Professional Summary',
            ],
          },
          {
            heading: 'How do I write the experience bullets?',
            paragraphs: [
              'Start each bullet with a past-tense action verb (Led, Built, Reduced, Launched) and finish with a result. Avoid passive phrasing such as "Responsible for".',
              'Convert values: show sums in the currency of the target market and use the local date style, for example 03/2022 - 09/2024 or Mar 2022 - Sep 2024, consistently across the document.',
            ],
          },
          {
            heading: 'What about language levels and diplomas?',
            paragraphs: [
              'State your English level with the European scale (B2, C1) or a clear word such as "Fluent", and list certificates if you have them (IELTS, TOEFL, Cambridge).',
              'Briefly explain Romanian diplomas whose names mean nothing abroad, for example "Licență in Computer Science (Bachelor of Science in Computer Science)".',
            ],
          },
        ],
        faq: [
          {
            question: 'Should I add a photo to the English resume?',
            answer: 'Many English-speaking countries do not expect one. Where it is common, follow local practice and the posting.',
          },
          {
            question: 'Do I translate Romanian company names?',
            answer:
              'No. Keep the official name and add a short descriptor if the company is not well known, for example "Romanian logistics company".',
          },
          {
            question: 'How do I show salary or seniority?',
            answer:
              'Leave salary off unless the posting asks for it. Show seniority through team size, budget or the volume you managed.',
          },
        ],
      },
    },
  },
  {
    datePublished: '2026-10-16',
    dateModified: '2026-10-16',
    content: {
      ro: {
        slug: 'structura-scrisorii-de-intentie',
        title: 'Cum scrii o scrisoare de intenție în 4 paragrafe',
        description:
          'Structura unei scrisori de intenție care se citește: formula de deschidere, dovada, potrivirea cu firma și încheierea, cu exemple și greșeli de evitat.',
        answer:
          'O scrisoare de intenție bună are o jumătate de pagină și patru părți: deschiderea cu postul și motivul, dovada cu o realizare măsurabilă, potrivirea cu firma și o încheiere cu pasul următor. Scrie-o pentru fiecare post, cu numele companiei și cu cel puțin un detaliu din anunț.',
        sections: [
          {
            heading: 'Cât de lungă trebuie să fie scrisoarea?',
            paragraphs: [
              'Între 200 și 300 de cuvinte, cât încape pe jumătate de pagină. Recrutorul o parcurge rapid, deci fiecare propoziție trebuie să aducă informație nouă față de CV.',
            ],
          },
          {
            heading: 'Ce scriu în primul paragraf?',
            paragraphs: [
              'Spune postul pentru care aplici, unde ai văzut anunțul și motivul concret pentru care te interesează compania. Evită „Subsemnatul” și formulele rigide. Un început direct se citește mai bine.',
              'Exemplu ilustrativ: „Vă scriu pentru postul de Specialist Marketing Digital. Campania voastră de rebranding m-a convins că echipa lucrează cu date, iar acesta este felul în care îmi place să lucrez.”',
            ],
          },
          {
            heading: 'Cum dovedesc că mă potrivesc?',
            paragraphs: [
              'Alege una sau două realizări din CV care răspund direct la cerințele anunțului și povestește-le în două-trei propoziții, cu un rezultat măsurabil. Scrisoarea completează CV-ul cu context, deci nu repeta lista de sarcini.',
            ],
            items: [
              'Reia competențele cerute în anunț, cu formularea lui.',
              'Pune un număr: procent, sumă, durată, dimensiunea echipei.',
              'Arată ce ai făcut tu personal, nu doar ce a făcut echipa.',
            ],
          },
          {
            heading: 'Cum închei scrisoarea?',
            paragraphs: [
              'Încheie cu disponibilitatea ta pentru un interviu și cu mulțumirea pentru timp. Un singur rând, politicos și direct. Semnează cu numele complet și cu datele de contact.',
            ],
          },
        ],
        faq: [
          {
            question: 'Mai este nevoie de scrisoare de intenție?',
            answer:
              'Dacă anunțul o cere, da. Când este opțională, o scrisoare bună te diferențiază, mai ales într-un domeniu în care mulți candidați au CV-uri similare.',
          },
          {
            question: 'Pot folosi aceeași scrisoare pentru mai multe joburi?',
            answer:
              'Poți păstra structura și realizările, dar schimbă numele companiei, postul și motivul interesului. Un șablon trimis nemodificat se recunoaște imediat.',
          },
          {
            question: 'Scrisoarea trebuie să fie PDF?',
            answer: 'PDF cu text selectabil este alegerea sigură. Dacă platforma cere text lipit într-un câmp, folosește același conținut, fără formatări speciale.',
          },
        ],
      },
      en: {
        slug: 'cover-letter-structure',
        title: 'How to write a cover letter in 4 paragraphs',
        description:
          'The structure of a cover letter that gets read: the opening, the proof, the fit with the company and the close, with examples and mistakes to avoid.',
        answer:
          'A good cover letter runs half a page across four parts: an opening with the role and your reason, proof with one measurable achievement, the fit with the company and a close with the next step. Write it per role, with the company name and at least one detail from the posting.',
        sections: [
          {
            heading: 'How long should a cover letter be?',
            paragraphs: [
              'Between 200 and 300 words, about half a page. The recruiter skims it, so each sentence must add something your resume does not already say.',
            ],
          },
          {
            heading: 'What goes in the first paragraph?',
            paragraphs: [
              'State the role you are applying for, where you saw it and the concrete reason the company interests you. Skip stiff formulas. A direct opening reads better.',
              'Illustrative example: "I am writing about the Digital Marketing Specialist role. Your rebranding campaign convinced me that your team works with data, which is how I like to work."',
            ],
          },
          {
            heading: 'How do I show that I am a fit?',
            paragraphs: [
              'Pick one or two achievements from your resume that answer the posting\'s requirements directly and tell them in two or three sentences with a measurable result. The letter adds context to the resume, so skip repeating the task list.',
            ],
            items: [
              'Reuse the skills the posting asks for, in its wording.',
              'Add a number: a percentage, a sum, a duration, a team size.',
              'Show what you did personally, beyond what the team did.',
            ],
          },
          {
            heading: 'How do I close the letter?',
            paragraphs: [
              'Close with your availability for an interview and thanks for the time. One polite, direct line. Sign with your full name and contact details.',
            ],
          },
        ],
        faq: [
          {
            question: 'Is a cover letter still needed?',
            answer:
              'If the posting asks for one, yes. When it is optional, a good letter sets you apart, especially in fields where many candidates have similar resumes.',
          },
          {
            question: 'Can I reuse the same letter for several jobs?',
            answer:
              'Keep the structure and the achievements, and change the company name, the role and the reason for your interest. An unchanged template is spotted immediately.',
          },
          {
            question: 'Should the cover letter be a PDF?',
            answer: 'A PDF with selectable text is the safe choice. If the platform asks for text in a field, paste the same content without special formatting.',
          },
        ],
      },
    },
  },
]

export const MORE_GUIDES: Guide[] = [...A, ...MORE_GUIDES_B]
