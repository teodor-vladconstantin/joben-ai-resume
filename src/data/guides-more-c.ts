// Guides 10-17. See guides.ts for the model. Copy rules: no em dashes, no "X, not Y" phrasing,
// no invented statistics.
import type { Guide } from './guides'

const DATE = '2026-10-16'

export const MORE_GUIDES_C: Guide[] = [
  {
    datePublished: DATE,
    dateModified: DATE,
    content: {
      ro: {
        slug: 'cv-pentru-schimbare-de-cariera',
        title: 'Cum scrii un CV pentru schimbare de carieră',
        description:
          'Cum construiești un CV când schimbi domeniul: competențe transferabile, rezumat orientat spre noul rol, proiecte și ordinea secțiunilor.',
        answer:
          'La o schimbare de carieră, CV-ul pune în față competențele transferabile și dovezile pentru noul domeniu: proiecte, cursuri, certificări. Rezumatul spune explicit către ce rol te îndrepți, iar experiența veche se rescrie cu rezultatele relevante pentru noul post. Păstrează ordinea cronologică, pentru că ATS-ul și recrutorii o citesc cel mai ușor.',
        sections: [
          {
            heading: 'Ce competențe transferabile pun în față?',
            paragraphs: [
              'Alege din experiența ta ce se aplică direct în noul rol: lucrul cu clienții, gestionarea proiectelor, analiza datelor, comunicarea, organizarea. Pentru fiecare, caută un exemplu cu rezultat măsurabil.',
              'Citește două-trei anunțuri pentru noul rol și compară cerințele cu ce ai făcut. Ce se potrivește merge în rezumat și în primele puncte ale fiecărui post.',
            ],
          },
          {
            heading: 'Cum scriu rezumatul?',
            paragraphs: [
              'Rezumatul spune în două-trei propoziții de unde vii, ce aduci și încotro mergi. Exemplu ilustrativ: „Fost profesor cu 8 ani de experiență în instruire și comunicare, în tranziție către rolul de specialist în training corporate. Am conceput și livrat cursuri pentru peste 300 de cursanți și am absolvit un program de instruire pentru formatori.”',
            ],
          },
          {
            heading: 'Cum arăt că am cunoștințele noului domeniu?',
            paragraphs: [
              'Adaugă o secțiune de proiecte sau de formare: cursuri finalizate, certificări, proiecte personale sau de voluntariat. Recrutorul vrea dovada că ai început deja drumul, iar un portofoliu mic valorează mai mult decât o declarație de intenție.',
            ],
            items: [
              'Un curs sau o certificare recunoscută în noul domeniu.',
              'Un proiect real cu rezultat: un site, un raport, o campanie, o analiză.',
              'Voluntariat sau muncă pro bono în noul domeniu.',
            ],
          },
          {
            heading: 'Ce fac cu experiența fără legătură?',
            paragraphs: [
              'Nu o ascunde și nu o umfla. Scurtează-o la puncte care arată competențele comune cu noul rol și păstrează perioadele reale. Un CV cu perioade clare este mai ușor de citit și de verificat.',
            ],
          },
        ],
        faq: [
          {
            question: 'Cronologic sau funcțional la schimbare de carieră?',
            answer:
              'De obicei cronologic, cu un rezumat bazat pe competențe în partea de sus. Formatul funcțional ascunde perioadele și multe sisteme ATS le mapează greșit.',
          },
          {
            question: 'Explic schimbarea în scrisoarea de intenție?',
            answer: 'Da. Scrisoarea este locul unde povestești motivul schimbării și ce ai făcut deja ca să te pregătești.',
          },
          {
            question: 'Cât durează până primesc răspunsuri?',
            answer: 'Depinde de domeniu și de piață. Un portofoliu și anunțuri alese cu atenție cresc șansele mai mult decât numărul de candidaturi.',
          },
        ],
      },
      en: {
        slug: 'career-change-resume',
        title: 'How to write a resume for a career change',
        description:
          'How to build a resume when you change fields: transferable skills, a summary aimed at the new role, projects and section order.',
        answer:
          'For a career change, the resume leads with transferable skills and proof for the new field: projects, courses, certifications. The summary says explicitly which role you are heading for, and the old experience is rewritten around results that matter for the new job. Keep the chronological order, since ATS software and recruiters read it most easily.',
        sections: [
          {
            heading: 'Which transferable skills do I put first?',
            paragraphs: [
              'Pick from your experience what applies directly to the new role: client work, project management, data analysis, communication, organization. For each one, find an example with a measurable result.',
              'Read two or three postings for the new role and compare their requirements with what you have done. What matches goes into the summary and into the first bullets of each job.',
            ],
          },
          {
            heading: 'How do I write the summary?',
            paragraphs: [
              'The summary says in two or three sentences where you come from, what you bring and where you are going. Illustrative example: "Former teacher with 8 years of experience in training and communication, moving into corporate training. Designed and delivered courses for over 300 learners and completed a train-the-trainer program."',
            ],
          },
          {
            heading: 'How do I show knowledge of the new field?',
            paragraphs: [
              'Add a projects or training section: completed courses, certifications, personal or volunteer projects. A recruiter wants proof that you have already started the journey, and a small portfolio is worth more than a statement of intent.',
            ],
            items: [
              'A recognized course or certification in the new field.',
              'A real project with a result: a site, a report, a campaign, an analysis.',
              'Volunteer or pro bono work in the new field.',
            ],
          },
          {
            heading: 'What do I do with unrelated experience?',
            paragraphs: [
              'Do not hide it and do not inflate it. Shorten it to bullets that show the skills shared with the new role and keep the real dates. A resume with clear dates is easier to read and to verify.',
            ],
          },
        ],
        faq: [
          {
            question: 'Chronological or functional for a career change?',
            answer:
              'Usually chronological, with a skills-based summary at the top. The functional format hides dates and many ATS systems map them wrongly.',
          },
          {
            question: 'Do I explain the change in the cover letter?',
            answer: 'Yes. The cover letter is where you tell the reason for the change and what you have already done to prepare.',
          },
          {
            question: 'How long until I get replies?',
            answer: 'It depends on the field and the market. A portfolio and carefully chosen postings help more than the number of applications.',
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
        slug: 'cv-dupa-o-pauza-in-cariera',
        title: 'Cum scrii un CV după o pauză în carieră',
        description: 'Cum prezinți o pauză de carieră în CV: cât detaliezi, cum o încadrezi, ce pui în rezumat și cum reiei contactul cu domeniul.',
        answer:
          'O pauză în carieră se prezintă scurt și onest, pe un singur rând, cu perioada și motivul în cuvinte neutre (îngrijire, studii, relocare, proiecte personale). Păstrează formatul cronologic, pune competențele actualizate în rezumat și arată ce ai făcut ca să rămâi la curent. Recrutorii judecă mai ales relevanța și actualitatea competențelor.',
        sections: [
          {
            heading: 'Cum scriu pauza în CV?',
            paragraphs: [
              'Adaugă pauza ca o intrare în ordinea cronologică, cu perioada și o formulare scurtă: „Pauză de carieră pentru îngrijirea familiei, 03/2023 - 09/2024”. Nu e nevoie de detalii personale.',
              'Dacă ai făcut ceva relevant în acest timp (cursuri, voluntariat, freelancing), pune-l sub aceeași intrare cu un rând sau două.',
            ],
          },
          {
            heading: 'Ce pun în rezumat?',
            paragraphs: [
              'Rezumatul spune ce experiență ai, ce competențe ai actualizat și ce post cauți. Exemplu ilustrativ: „Specialist în HR cu 9 ani de experiență în recrutare, revenit după o pauză de 18 luni. Am finalizat un curs actualizat de legislație muncii și un program pe ATS-uri de recrutare.”',
            ],
          },
          {
            heading: 'Cum arăt că sunt la curent?',
            paragraphs: [
              'Pune în față cursurile recente, certificările și uneltele pe care le folosești acum. Dacă domeniul se schimbă repede, un proiect mic recent contează mult.',
            ],
            items: [
              'Cursuri online finalizate în ultimul an, cu numele platformei.',
              'Certificări reînnoite sau obținute.',
              'Proiecte sau munci temporare, chiar cu normă redusă.',
            ],
          },
          {
            heading: 'Cum abordez subiectul la interviu?',
            paragraphs: [
              'Pregătește un răspuns de 2-3 propoziții: ce s-a întâmplat, ce ai făcut între timp și de ce ești pregătit să revii. Rămâi calm și concentrat pe ce poți aduce acum.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pot omite pauza?',
            answer: 'Poți folosi ani în loc de luni, dar o perioadă lungă neexplicată ridică întrebări. O intrare scurtă și onestă funcționează mai bine.',
          },
          {
            question: 'Trebuie să spun motivul?',
            answer: 'Nu ești obligat să dai detalii personale. O formulare neutră și scurtă este suficientă.',
          },
          {
            question: 'Cum afectează pauza un ATS?',
            answer: 'ATS-ul calculează de obicei experiența din perioadele listate. O intrare clară pentru pauză evită perioade suprapuse sau lipsă.',
          },
        ],
      },
      en: {
        slug: 'resume-after-a-career-gap',
        title: 'How to write a resume after a career gap',
        description: 'How to present a career gap on a resume: how much to explain, how to frame it, what goes in the summary and how to show you are current.',
        answer:
          'Present a career gap briefly and honestly, on a single line, with the dates and the reason in neutral words (caregiving, studies, relocation, personal projects). Keep the chronological format, put updated skills in the summary and show what you did to stay current. Recruiters mostly judge relevance and how current your skills are.',
        sections: [
          {
            heading: 'How do I write the gap on the resume?',
            paragraphs: [
              'Add the gap as an entry in chronological order, with the dates and a short phrase: "Career break for family caregiving, 03/2023 - 09/2024". No personal detail is needed.',
              'If you did something relevant during that time (courses, volunteering, freelancing), list it under the same entry in a line or two.',
            ],
          },
          {
            heading: 'What goes in the summary?',
            paragraphs: [
              'The summary says what experience you have, which skills you have updated and which role you want. Illustrative example: "HR specialist with 9 years of recruiting experience, returning after an 18-month break. Completed an updated employment law course and a program on recruiting ATS platforms."',
            ],
          },
          {
            heading: 'How do I show I am current?',
            paragraphs: [
              'Put recent courses, certifications and the tools you use now up front. If the field changes fast, a small recent project counts for a lot.',
            ],
            items: [
              'Online courses completed in the past year, naming the platform.',
              'Certifications renewed or earned.',
              'Projects or temporary work, even part-time.',
            ],
          },
          {
            heading: 'How do I handle it in an interview?',
            paragraphs: [
              'Prepare a two or three sentence answer: what happened, what you did in the meantime and why you are ready to return. Stay calm and focused on what you can bring now.',
            ],
          },
        ],
        faq: [
          {
            question: 'Can I leave the gap out?',
            answer: 'You can use years instead of months, but a long unexplained period raises questions. A short, honest entry works better.',
          },
          {
            question: 'Do I have to give the reason?',
            answer: 'You are not obliged to share personal details. A short, neutral phrase is enough.',
          },
          {
            question: 'How does a gap affect an ATS?',
            answer: 'An ATS usually computes experience from the listed periods. A clear entry for the gap avoids overlapping or missing dates.',
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
        slug: 'cv-pentru-freelancer',
        title: 'Cum scrii un CV de freelancer sau PFA',
        description: 'Cum prezinți munca independentă în CV: clienți, proiecte, rezultate, perioade și cum treci de la freelancing la un job cu normă întreagă.',
        answer:
          'Munca independentă se prezintă ca un post: titlul („Freelancer” sau „Consultant independent”), perioada și 3-5 puncte cu clienți, proiecte și rezultate. Grupează proiectele mici pe categorii și numește clienții doar când ai acord sau când sunt publici. Pune cifrele (proiecte livrate, venituri aduse clientului, termene) în față.',
        sections: [
          {
            heading: 'Cum structurez experiența de freelancer?',
            paragraphs: [
              'Folosește o singură intrare pentru perioada de freelancing: „Freelancer, copywriter, 2021 - prezent”. Dedesubt, 3-5 puncte cu cele mai relevante proiecte, nu o listă de toți clienții.',
              'Dacă ai lucrat cu clienți mari, numește-i (dacă ai voie). Altfel, descrie tipul: „agenție de marketing cu 40 de angajați”, „magazin online de modă”.',
            ],
          },
          {
            heading: 'Ce rezultate pun?',
            paragraphs: [
              'Rezultatele clientului contează mai mult decât volumul tău de muncă: creștere de trafic, vânzări, economii de timp, termene respectate. Exemplu ilustrativ: „Am livrat 24 de site-uri pentru IMM-uri în 3 ani, cu un timp mediu de predare de 18 zile și un scor de 4,9/5 în recenziile clienților.”',
            ],
          },
          {
            heading: 'Cum arăt fiabilitatea?',
            paragraphs: [
              'Clienții recurenți, recomandările și termenele respectate sunt dovada că ești de încredere. Un link către portofoliu sau profil (Upwork, GitHub, Behance) completează CV-ul.',
            ],
            items: [
              'Număr de clienți recurenți sau proiecte repetate.',
              'Link către portofoliu sau profil public.',
              'Unelte și metode de lucru (Jira, Notion, contracte, facturare).',
            ],
          },
          {
            heading: 'Cum trec la un job cu normă întreagă?',
            paragraphs: [
              'Subliniază lucrul în echipă, procesele și rezultatele pe termen lung, pentru că angajatorul se teme de lipsa de integrare. Menționează colaborările cu echipe ale clienților și responsabilitățile de management de proiect.',
            ],
          },
        ],
        faq: [
          {
            question: 'Trec fiecare client ca post separat?',
            answer: 'Nu. Un singur post de freelancer, cu proiectele relevante dedesubt, este mai clar și mai ușor de citit.',
          },
          {
            question: 'Mențiunea PFA este necesară?',
            answer: 'Nu e obligatorie. „Freelancer” sau „Consultant independent” este mai ușor de înțeles de recrutori și de ATS.',
          },
          {
            question: 'Cum tratez perioadele fără proiecte?',
            answer: 'Ține o singură intrare continuă pentru freelancing și pune accentul pe proiectele livrate, nu pe lunile libere.',
          },
        ],
      },
      en: {
        slug: 'freelancer-resume',
        title: 'How to write a freelancer resume',
        description: 'How to present independent work on a resume: clients, projects, results, dates and how to move from freelancing to a full-time job.',
        answer:
          'Independent work is presented like a job: a title ("Freelancer" or "Independent consultant"), the dates and 3 to 5 bullets with clients, projects and results. Group small projects by category and name clients only when you have permission or when they are public. Put the numbers (projects delivered, revenue brought to the client, deadlines) up front.',
        sections: [
          {
            heading: 'How do I structure freelance experience?',
            paragraphs: [
              'Use a single entry for the freelancing period: "Freelancer, copywriter, 2021 - present". Under it, 3 to 5 bullets with the most relevant projects, and skip listing every client.',
              'If you worked with large clients, name them (if allowed). Otherwise describe the type: "marketing agency with 40 employees", "online fashion store".',
            ],
          },
          {
            heading: 'Which results do I include?',
            paragraphs: [
              'Client results count more than your volume of work: traffic growth, sales, time saved, deadlines met. Illustrative example: "Delivered 24 websites for small businesses over 3 years, with an average handover time of 18 days and a 4.9/5 client review score."',
            ],
          },
          {
            heading: 'How do I show reliability?',
            paragraphs: [
              'Repeat clients, referrals and met deadlines are proof you can be trusted. A link to a portfolio or profile (Upwork, GitHub, Behance) completes the resume.',
            ],
            items: [
              'Number of repeat clients or repeated projects.',
              'A link to a portfolio or public profile.',
              'Tools and working methods (Jira, Notion, contracts, invoicing).',
            ],
          },
          {
            heading: 'How do I move to a full-time job?',
            paragraphs: [
              'Stress teamwork, processes and long-term results, since employers worry about fit. Mention collaboration with client teams and project management responsibilities.',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I list each client as a separate job?',
            answer: 'No. A single freelancer entry with the relevant projects beneath it is clearer and easier to read.',
          },
          {
            question: 'Do I need to mention the PFA status?',
            answer: 'It is not required. "Freelancer" or "Independent consultant" is easier for recruiters and ATS to understand.',
          },
          {
            question: 'How do I treat periods without projects?',
            answer: 'Keep one continuous freelancing entry and emphasize delivered projects over idle months.',
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
        slug: 'cv-sau-linkedin',
        title: 'CV sau profil LinkedIn: ce pui unde',
        description: 'Diferența dintre CV și LinkedIn, ce informații se potrivesc fiecăruia și cum le ții coerente fără să copiezi mecanic.',
        answer:
          'CV-ul este documentul adaptat fiecărui anunț, scurt și concentrat pe rezultate, iar LinkedIn este profilul public, mai larg, care te face găsit de recrutori. Păstrează aceleași funcții, companii și perioade în ambele, dar adaptează CV-ul pentru fiecare post, iar pe LinkedIn adaugă recomandări, proiecte și cuvinte cheie ale domeniului tău.',
        sections: [
          {
            heading: 'Care este rolul fiecăruia?',
            paragraphs: [
              'CV-ul se trimite unui anunț concret și se adaptează la el. LinkedIn funcționează tot timpul: recrutorii caută acolo după cuvinte cheie, locație și experiență, deci profilul trebuie să fie complet chiar și când nu aplici.',
            ],
          },
          {
            heading: 'Ce diferă între ele?',
            paragraphs: ['Diferențele practice:'],
            items: [
              'CV: o pagină sau două, adaptat la anunț, cu cele mai relevante realizări.',
              'LinkedIn: tot parcursul, cu detalii, proiecte, recomandări și activitate (postări, articole).',
              'CV: ton concis, orientat spre post. LinkedIn: ton mai personal, cu un rezumat în prima persoană.',
            ],
          },
          {
            heading: 'Cum le țin coerente?',
            paragraphs: [
              'Aceleași titluri de funcții, companii și perioade. O diferență între CV și LinkedIn (de exemplu alt titlu sau alte date) apare repede la verificare și strică încrederea.',
              'Pune linkul profilului LinkedIn în antetul CV-ului, ca text, și o adresă personalizată (linkedin.com/in/prenume-nume).',
            ],
          },
          {
            heading: 'Ce adaug doar pe LinkedIn?',
            paragraphs: [
              'Recomandări de la colegi, aptitudini validate, proiecte cu linkuri și un titlu (headline) bogat în cuvinte cheie, de exemplu „Contabil | Închideri lunare, e-Factura, SAF-T”. Acestea ajută la căutările recrutorilor.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pot trimite linkul LinkedIn în loc de CV?',
            answer: 'Doar dacă anunțul o permite. În mod normal se cere un CV, iar profilul îl completează.',
          },
          {
            question: 'Trebuie să am același text în ambele?',
            answer: 'Nu același text, dar aceleași fapte. LinkedIn poate fi mai detaliat, iar CV-ul mai concis.',
          },
          {
            question: 'Contează fotografia de pe LinkedIn?',
            answer: 'Un profil cu fotografie clară și profesională inspiră mai multă încredere. Alege una recentă, cu fața vizibilă.',
          },
        ],
      },
      en: {
        slug: 'resume-vs-linkedin',
        title: 'Resume vs LinkedIn profile: what goes where',
        description: 'The difference between a resume and a LinkedIn profile, which information suits each and how to keep them consistent without copying mechanically.',
        answer:
          'The resume is the document tailored to each posting, short and focused on results, while LinkedIn is the broader public profile that gets you found by recruiters. Keep the same titles, employers and dates in both, but tailor the resume for each role, and on LinkedIn add recommendations, projects and keywords of your field.',
        sections: [
          {
            heading: 'What is the role of each?',
            paragraphs: [
              'The resume is sent to a specific posting and tailored to it. LinkedIn works all the time: recruiters search there by keyword, location and experience, so the profile should be complete even when you are not applying.',
            ],
          },
          {
            heading: 'How do they differ?',
            paragraphs: ['The practical differences:'],
            items: [
              'Resume: one or two pages, tailored to the posting, with the most relevant achievements.',
              'LinkedIn: the whole journey, with detail, projects, recommendations and activity (posts, articles).',
              'Resume: concise, role-focused tone. LinkedIn: a more personal tone, with a first-person summary.',
            ],
          },
          {
            heading: 'How do I keep them consistent?',
            paragraphs: [
              'Use the same job titles, employers and dates. A mismatch between resume and LinkedIn (a different title or different dates) shows up quickly in a check and weakens trust.',
              'Put the LinkedIn link in the resume header as text, with a custom URL (linkedin.com/in/first-last).',
            ],
          },
          {
            heading: 'What do I add only on LinkedIn?',
            paragraphs: [
              'Recommendations from colleagues, endorsed skills, projects with links and a keyword-rich headline, for example "Accountant | Month-end close, e-invoicing, SAF-T". These help with recruiter searches.',
            ],
          },
        ],
        faq: [
          {
            question: 'Can I send the LinkedIn link instead of a resume?',
            answer: 'Only if the posting allows it. Normally a resume is requested and the profile complements it.',
          },
          {
            question: 'Should the text be identical in both?',
            answer: 'The facts should match, but the text need not. LinkedIn can be more detailed and the resume more concise.',
          },
          {
            question: 'Does the LinkedIn photo matter?',
            answer: 'A profile with a clear, professional photo inspires more trust. Choose a recent one with the face visible.',
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
        slug: 'povesteste-mi-despre-tine-raspuns',
        title: 'Cum răspunzi la „Povestește-mi despre tine” la interviu',
        description: 'Structura unui răspuns de un minut la „Povestește-mi despre tine”: prezent, trecut, viitor, cu exemple și greșeli de evitat.',
        answer:
          'Răspunde în aproximativ un minut, în trei pași: cine ești profesional acum (prezent), ce te-a adus aici cu una-două realizări (trecut) și de ce te interesează postul (viitor). Folosește informații din CV, dar spune-le ca pe o poveste scurtă, cu un rezultat concret, și încheie cu legătura către firma care intervievează.',
        sections: [
          {
            heading: 'Ce urmărește recrutorul cu această întrebare?',
            paragraphs: [
              'Vrea să vadă cum te prezinți, cât de clar comunici și dacă experiența ta se potrivește cu postul. Nu cere biografia completă, ci o sinteză relevantă.',
            ],
          },
          {
            heading: 'Care este structura prezent-trecut-viitor?',
            paragraphs: [
              'Prezent: rolul actual și domeniul, într-o propoziție. Trecut: una sau două realizări care arată de ce ești potrivit. Viitor: motivul concret pentru care postul urmează firesc din parcursul tău.',
              'Exemplu ilustrativ: „Sunt analist de date într-o companie de retail, unde construiesc rapoarte pentru echipa comercială. Anul trecut am automatizat raportarea lunară și am redus timpul de pregătire de la 3 zile la 4 ore. Mă interesează postul vostru pentru că vreau să lucrez cu date de produs și să iau decizii mai aproape de utilizatori.”',
            ],
          },
          {
            heading: 'Ce evit?',
            paragraphs: ['Capcanele frecvente:'],
            items: [
              'Să povestești tot CV-ul în ordine cronologică.',
              'Să vorbești despre viața personală fără legătură cu postul.',
              'Să depășești două minute sau să improvizezi fără structură.',
            ],
          },
          {
            heading: 'Cum mă pregătesc?',
            paragraphs: [
              'Scrie răspunsul, exersează-l cu voce tare de 3-4 ori și cronometrează-l. Adaptează ultimul pas pentru fiecare firmă, pe baza anunțului și a site-ului lor.',
            ],
          },
        ],
        faq: [
          {
            question: 'Cât durează răspunsul ideal?',
            answer: 'Între 60 și 90 de secunde. Dacă recrutorul vrea detalii, va pune întrebări suplimentare.',
          },
          {
            question: 'Pot începe cu copilăria sau cu studiile?',
            answer: 'Doar dacă sunt direct relevante pentru post. Altfel începe cu rolul actual.',
          },
          {
            question: 'Răspunsul se schimbă pentru un post nou în carieră?',
            answer: 'Da, accentul trece pe competențele transferabile și pe motivul schimbării.',
          },
        ],
      },
      en: {
        slug: 'tell-me-about-yourself-answer',
        title: 'How to answer "Tell me about yourself" in an interview',
        description: 'The structure of a one-minute answer to "Tell me about yourself": present, past, future, with examples and mistakes to avoid.',
        answer:
          'Answer in about a minute, in three steps: who you are professionally now (present), what brought you here with one or two achievements (past) and why the role interests you (future). Use information from your resume, but tell it as a short story with a concrete result and close with the link to the company interviewing you.',
        sections: [
          {
            heading: 'What is the interviewer after with this question?',
            paragraphs: [
              'They want to see how you present yourself, how clearly you communicate and whether your experience fits the role. The question asks for a relevant summary, and your full biography goes beyond it.',
            ],
          },
          {
            heading: 'What is the present-past-future structure?',
            paragraphs: [
              'Present: your current role and field, in one sentence. Past: one or two achievements that show why you are a fit. Future: the concrete reason the role follows naturally from your path.',
              'Illustrative example: "I am a data analyst at a retail company, where I build reports for the commercial team. Last year I automated the monthly reporting and cut preparation time from 3 days to 4 hours. I am interested in your role because I want to work with product data and make decisions closer to users."',
            ],
          },
          {
            heading: 'What do I avoid?',
            paragraphs: ['Common traps:'],
            items: [
              'Retelling the whole resume in chronological order.',
              'Talking about personal life unrelated to the role.',
              'Running past two minutes or improvising without structure.',
            ],
          },
          {
            heading: 'How do I prepare?',
            paragraphs: [
              'Write the answer, practice it aloud 3 or 4 times and time it. Adapt the last step for each company, based on the posting and their website.',
            ],
          },
        ],
        faq: [
          {
            question: 'How long is the ideal answer?',
            answer: 'Between 60 and 90 seconds. If the interviewer wants detail, they will ask follow-up questions.',
          },
          {
            question: 'Can I start with my childhood or my studies?',
            answer: 'Only if they are directly relevant to the role. Otherwise start with your current role.',
          },
          {
            question: 'Does the answer change for a career change?',
            answer: 'Yes, the emphasis moves to transferable skills and the reason for the change.',
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
        slug: 'referinte-in-cv',
        title: 'Referințe în CV: le pui sau nu?',
        description: 'Când să incluzi referințe în CV, cum le formulezi, cum ceri acordul și ce faci când anunțul nu le cere.',
        answer:
          'Nu mai pune „Referințe la cerere” în CV, pentru că spațiul se folosește mai bine pentru realizări. Pregătește o listă separată de 2-3 persoane, cu acordul lor, și trimite-o doar când ți se cere, de obicei după interviu. Include referințe în CV doar dacă anunțul o cere explicit.',
        sections: [
          {
            heading: 'De ce nu mai trec „Referințe la cerere”?',
            paragraphs: [
              'Recrutorul știe că le poți da la cerere, deci rândul nu aduce informație și ocupă loc. Folosește spațiul pentru o realizare în plus.',
            ],
          },
          {
            heading: 'Cine sunt cele mai bune referințe?',
            paragraphs: [
              'Foști manageri, colegi cu care ai lucrat direct sau clienți. Alege persoane care pot vorbi concret despre munca ta și care răspund repede.',
            ],
            items: [
              'Un manager direct din ultimul job.',
              'Un coleg sau un client care a văzut rezultatele tale.',
              'Pentru începători: un profesor, un coordonator de practică sau de voluntariat.',
            ],
          },
          {
            heading: 'Cum cer acordul?',
            paragraphs: [
              'Cere întotdeauna permisiunea înainte să dai numele cuiva. Spune-i despre ce post este vorba și ce ai vrea să sublinieze, și trimite-i CV-ul actualizat. Datele de contact ale unei persoane sunt date personale, deci le oferi doar cu acordul ei.',
            ],
          },
          {
            heading: 'Cum arată lista de referințe?',
            paragraphs: [
              'Un document separat, cu numele tău în antet și, pentru fiecare persoană: nume, funcție, companie, relația cu tine, e-mail și telefon.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pot pune recomandări scrise în CV?',
            answer: 'Un citat scurt de o propoziție, cu numele și funcția autorului, este în regulă. Textele lungi se atașează separat sau se leagă de LinkedIn.',
          },
          {
            question: 'Ce fac dacă nu pot da referințe de la ultimul job?',
            answer: 'Alege alți colegi sau manageri de la joburile anterioare, sau clienți. Explică onest situația dacă ți se cere.',
          },
          {
            question: 'Când se cer de obicei referințele?',
            answer: 'De obicei după interviu, în ultima etapă. Fii pregătit cu lista la momentul respectiv.',
          },
        ],
      },
      en: {
        slug: 'references-on-resume',
        title: 'References on a resume: include them or not?',
        description: 'When to include references on a resume, how to phrase them, how to ask permission and what to do when the posting does not ask.',
        answer:
          'Skip "References available on request" on the resume, since the space serves achievements better. Prepare a separate list of 2 or 3 people, with their permission, and send it only when asked, usually after the interview. Include references on the resume only when the posting asks for them explicitly.',
        sections: [
          {
            heading: 'Why drop "References on request"?',
            paragraphs: [
              'The recruiter knows you can provide them on request, so the line adds no information and takes space. Use the space for one more achievement.',
            ],
          },
          {
            heading: 'Who are the best references?',
            paragraphs: [
              'Former managers, colleagues you worked with directly or clients. Pick people who can speak concretely about your work and who respond quickly.',
            ],
            items: [
              'A direct manager from your last job.',
              'A colleague or client who saw your results.',
              'For beginners: a teacher, an internship coordinator or a volunteer supervisor.',
            ],
          },
          {
            heading: 'How do I ask permission?',
            paragraphs: [
              'Always ask before giving someone\'s name. Tell them which role it is for and what you would like them to highlight, and send them your updated resume. A person\'s contact details are personal data, so you share them only with their consent.',
            ],
          },
          {
            heading: 'What does a reference list look like?',
            paragraphs: [
              'A separate document with your name in the header and, for each person: name, title, company, relationship to you, email and phone.',
            ],
          },
        ],
        faq: [
          {
            question: 'Can I put written recommendations on the resume?',
            answer: 'A short one-sentence quote with the author\'s name and title is fine. Longer texts are attached separately or linked from LinkedIn.',
          },
          {
            question: 'What if I cannot give references from my last job?',
            answer: 'Choose other colleagues or managers from earlier jobs, or clients. Explain the situation honestly if asked.',
          },
          {
            question: 'When are references usually requested?',
            answer: 'Usually after the interview, in the last stage. Have the list ready by then.',
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
        slug: 'scrisoare-de-intentie-fara-experienta',
        title: 'Scrisoare de intenție fără experiență: ghid și exemplu',
        description: 'Cum scrii o scrisoare de intenție când nu ai experiență: ce pui în loc de joburi anterioare, structură și un exemplu.',
        answer:
          'Fără experiență, scrisoarea se bazează pe proiecte, studii, practică și motivație concretă. Alege o realizare măsurabilă (un proiect, un eveniment, o lucrare), leagă-o de o cerință din anunț și arată ce știi despre firmă. Păstrează-o la 200-250 de cuvinte, în patru paragrafe.',
        sections: [
          {
            heading: 'Ce pun în loc de experiență?',
            paragraphs: [
              'Dovezi că poți face munca: un proiect de la facultate, o lucrare, voluntariat, practică, un curs cu aplicație practică. Alege cea mai apropiată de post și povestește-o cu rezultatul ei.',
            ],
          },
          {
            heading: 'Cum arată structura?',
            paragraphs: ['Patru paragrafe scurte:'],
            items: [
              'Deschidere: postul, unde ai văzut anunțul și motivul interesului pentru firmă.',
              'Dovada: un proiect sau o activitate, cu un rezultat concret.',
              'Potrivirea: două-trei cerințe din anunț și ce ai făcut care le acoperă.',
              'Încheiere: disponibilitatea pentru interviu și mulțumiri.',
            ],
          },
          {
            heading: 'Cum arată un exemplu?',
            paragraphs: [
              'Exemplu ilustrativ (deschidere + dovadă): „Vă scriu pentru postul de Asistent Marketing. În anul trei am coordonat o campanie pentru un eveniment studențesc, cu o echipă de 6 colegi, care a adus 420 de participanți, cu 35% peste obiectiv. Aș vrea să aplic aceeași organizare și atenție la rezultate în echipa voastră.”',
            ],
          },
          {
            heading: 'Ce evit?',
            paragraphs: [
              'Scuzele („nu am experiență, dar...”) și laudele generale fără exemple. Spune ce ai făcut și ce rezultat a ieșit. Folosește un ton direct și politicos.',
            ],
          },
        ],
        faq: [
          {
            question: 'Este necesară scrisoarea dacă nu am experiență?',
            answer: 'Este foarte utilă, pentru că îți permite să arăți motivația și proiectele pe care CV-ul le poate doar enumera.',
          },
          {
            question: 'Pot folosi un șablon?',
            answer: 'Poți folosi structura, dar scrie conținutul pentru fiecare post. Un text copiat se observă imediat.',
          },
          {
            question: 'Cât de formală trebuie să fie?',
            answer: 'Politicoasă și clară. Evită formulele rigide vechi; un ton profesional și direct se citește mai bine.',
          },
        ],
      },
      en: {
        slug: 'cover-letter-no-experience',
        title: 'Cover letter with no experience: guide and example',
        description: 'How to write a cover letter when you have no experience: what to use instead of previous jobs, structure and an example.',
        answer:
          'Without experience, the letter rests on projects, studies, internships and concrete motivation. Pick one measurable achievement (a project, an event, a thesis), tie it to a requirement in the posting and show what you know about the company. Keep it to 200 to 250 words, in four paragraphs.',
        sections: [
          {
            heading: 'What do I use instead of experience?',
            paragraphs: [
              'Evidence that you can do the work: a university project, a thesis, volunteering, an internship, a course with a practical application. Pick the one closest to the role and tell it with its result.',
            ],
          },
          {
            heading: 'What does the structure look like?',
            paragraphs: ['Four short paragraphs:'],
            items: [
              'Opening: the role, where you saw the posting and the reason for your interest in the company.',
              'Proof: one project or activity, with a concrete result.',
              'Fit: two or three requirements from the posting and what you did that covers them.',
              'Close: your availability for an interview and thanks.',
            ],
          },
          {
            heading: 'What does an example look like?',
            paragraphs: [
              'Illustrative example (opening + proof): "I am writing about the Marketing Assistant role. In my third year I coordinated a campaign for a student event, with a team of 6 peers, which brought 420 attendees, 35% above target. I would like to bring the same organization and focus on results to your team."',
            ],
          },
          {
            heading: 'What do I avoid?',
            paragraphs: [
              'Apologies ("I have no experience, but...") and general praise without examples. Say what you did and what came out of it. Use a direct, polite tone.',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I need a cover letter if I have no experience?',
            answer: 'It is very useful, since it lets you show the motivation and projects that the resume can only list.',
          },
          {
            question: 'Can I use a template?',
            answer: 'You can use the structure, but write the content for each role. A copied text is spotted immediately.',
          },
          {
            question: 'How formal should it be?',
            answer: 'Polite and clear. Avoid the old rigid formulas; a professional, direct tone reads better.',
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
        slug: 'portofoliu-pentru-dezvoltatori',
        title: 'Portofoliu pentru dezvoltatori: ce pui și cum îl legi de CV',
        description: 'Ce proiecte aleg pentru portofoliul de dezvoltator, cum le descriu, ce pun pe GitHub și cum leg portofoliul de CV.',
        answer:
          'Un portofoliu bun de dezvoltator are 3-5 proiecte finalizate, fiecare cu link live, cod pe GitHub, o descriere scurtă a problemei, a tehnologiilor și a rezultatului. Pune linkul portofoliului și al profilului GitHub în antetul CV-ului, ca text, și alege proiectele după tipul de post pe care îl cauți.',
        sections: [
          {
            heading: 'Câte proiecte și care?',
            paragraphs: [
              'Trei până la cinci proiecte finalizate sunt mai convingătoare decât zece începute. Alege proiecte care arată competențele cerute în anunțurile țintă: un frontend, un API, o aplicație full-stack cu autentificare și bază de date.',
            ],
          },
          {
            heading: 'Cum descriu fiecare proiect?',
            paragraphs: ['Folosește aceeași schemă pentru fiecare:'],
            items: [
              'Problema pe care o rezolvă, într-o propoziție.',
              'Tehnologii folosite (TypeScript, React, PostgreSQL, Docker).',
              'Rezultatul sau particularitatea: performanță, număr de utilizatori, teste.',
              'Link live și link către cod.',
            ],
          },
          {
            heading: 'Cum arată un GitHub bun?',
            paragraphs: [
              'Repository-uri cu README clar (ce face, cum se rulează, capturi de ecran), commit-uri cu mesaje înțelese și teste acolo unde are sens. Fixează (pin) pe profil proiectele cele mai bune.',
            ],
          },
          {
            heading: 'Cum îl leg de CV?',
            paragraphs: [
              'Pune linkurile în antet, ca text simplu (de exemplu github.com/nume), și menționează în CV proiectele cele mai relevante cu un rând de rezultat. Recrutorul tehnic va deschide linkul, deci verifică-l înainte de fiecare candidatură.',
            ],
          },
        ],
        faq: [
          {
            question: 'Am nevoie de un site de portofoliu sau ajunge GitHub?',
            answer: 'GitHub ajunge pentru început, dacă este ordonat. Un site simplu adaugă control asupra prezentării, dar nu este obligatoriu.',
          },
          {
            question: 'Pot include proiecte de curs?',
            answer: 'Da, dacă sunt finalizate și bine documentate. Adaugă ce ai schimbat sau extins față de cerința inițială.',
          },
          {
            question: 'Ce fac cu codul de la muncă, care e confidențial?',
            answer: 'Nu îl publica. Descrie în CV impactul și tehnologiile fără detalii confidențiale și arată proiecte personale pentru cod.',
          },
        ],
      },
      en: {
        slug: 'developer-portfolio',
        title: 'Developer portfolio: what to include and how to link it to your resume',
        description: 'Which projects to choose for a developer portfolio, how to describe them, what to put on GitHub and how to link the portfolio to your resume.',
        answer:
          'A good developer portfolio has 3 to 5 finished projects, each with a live link, code on GitHub and a short description of the problem, the technologies and the result. Put the portfolio and GitHub links in the resume header as text, and choose the projects by the type of role you are after.',
        sections: [
          {
            heading: 'How many projects, and which ones?',
            paragraphs: [
              'Three to five finished projects are more convincing than ten that were started. Choose projects that show the skills asked for in your target postings: a frontend, an API, a full-stack app with authentication and a database.',
            ],
          },
          {
            heading: 'How do I describe each project?',
            paragraphs: ['Use the same scheme for each:'],
            items: [
              'The problem it solves, in one sentence.',
              'Technologies used (TypeScript, React, PostgreSQL, Docker).',
              'The result or a distinguishing feature: performance, number of users, tests.',
              'A live link and a link to the code.',
            ],
          },
          {
            heading: 'What does a good GitHub look like?',
            paragraphs: [
              'Repositories with a clear README (what it does, how to run it, screenshots), commits with understandable messages and tests where they make sense. Pin your best projects on the profile.',
            ],
          },
          {
            heading: 'How do I link it to the resume?',
            paragraphs: [
              'Put the links in the header as plain text (for example github.com/name), and mention the most relevant projects on the resume with a one-line result. A technical recruiter will open the link, so check it before each application.',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I need a portfolio site or is GitHub enough?',
            answer: 'GitHub is enough to start, if it is tidy. A simple site adds control over presentation but is not required.',
          },
          {
            question: 'Can I include course projects?',
            answer: 'Yes, if they are finished and well documented. Add what you changed or extended beyond the original assignment.',
          },
          {
            question: 'What about confidential code from work?',
            answer: 'Do not publish it. Describe the impact and technologies on the resume without confidential details and show personal projects for code.',
          },
        ],
      },
    },
  },
]
