// Guides 18-25. See guides.ts for the model. Copy rules: no em dashes, no "X, not Y" phrasing,
// no invented statistics. Salary and legal topics avoid figures that change over time.
import type { Guide } from './guides'

const DATE = '2026-10-16'

export const MORE_GUIDES_D: Guide[] = [
  {
    datePublished: DATE,
    dateModified: DATE,
    content: {
      ro: {
        slug: 'cv-pentru-medici-si-asistenti-medicali',
        title: 'CV pentru medici și asistenți medicali: ghid',
        description: 'Cum structurezi un CV în domeniul sănătății: drept de practică, specializări, experiență clinică, formări continue și greșeli frecvente.',
        answer:
          'Un CV medical pune în față dreptul de liberă practică, specializarea și experiența clinică, apoi formările continue și competențele procedurale. Detaliază tipul de unitate, secția, volumul de pacienți și procedurile pe care le execuți, fără date care identifică pacienții. Păstrează ordinea cronologică și o structură clară.',
        sections: [
          {
            heading: 'Ce pun primul într-un CV medical?',
            paragraphs: [
              'Rezumatul spune specialitatea, anii de experiență și domeniul de interes. Imediat după, pune dreptul de liberă practică și aprobările necesare, pentru că recrutorul le caută primele.',
            ],
          },
          {
            heading: 'Cum descriu experiența clinică?',
            paragraphs: [
              'Pentru fiecare post: unitatea (spital, clinică, cabinet), secția sau serviciul, perioada și 3-5 puncte cu volum și rezultate. Exemplu ilustrativ: „Am asistat în medie 12 pacienți pe tură pe o secție de chirurgie cu 30 de paturi și am introdus o listă de verificare pentru preluarea turei.”',
              'Nu include nume de pacienți sau date care îi pot identifica. Descrie tipurile de cazuri și lasă persoanele deoparte.',
            ],
          },
          {
            heading: 'Ce formări și competențe contează?',
            paragraphs: ['Listează cursurile, certificările și competențele procedurale relevante:'],
            items: [
              'Cursuri de formare continuă și acreditări, cu anul.',
              'Proceduri și aparatură folosite (de exemplu monitorizare, perfuzii, echipamente de diagnostic).',
              'Limbi străine, importante pentru munca în străinătate.',
              'Participări la studii, publicații sau conferințe, dacă există.',
            ],
          },
          {
            heading: 'Ce greșeli evit?',
            paragraphs: [
              'Un CV prea lung, cu toate gărzile și cursurile enumerate, ascunde esențialul. Păstrează ce arată specializarea și experiența pentru postul vizat.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pun poză în CV-ul medical?',
            answer: 'Este opțional. Pentru aplicări în străinătate, urmează practica locală, care adesea omite poza.',
          },
          {
            question: 'Cât de lung trebuie să fie?',
            answer: 'Una sau două pagini. Publicațiile și cursurile pot merge într-o anexă separată dacă sunt multe.',
          },
          {
            question: 'Cum aplic într-un alt stat membru?',
            answer: 'Verifică cerințele de recunoaștere a calificării și limba cerută de angajator și de autoritatea locală.',
          },
        ],
      },
      en: {
        slug: 'resume-for-doctors-and-nurses',
        title: 'Resume for doctors and nurses: a guide',
        description: 'How to structure a healthcare resume: license to practice, specialties, clinical experience, continuing training and common mistakes.',
        answer:
          'A medical resume puts your license to practice, specialty and clinical experience up front, followed by continuing training and procedural skills. Detail the type of facility, the ward, the patient volume and the procedures you perform, without any data that identifies patients. Keep the chronological order and a clear structure.',
        sections: [
          {
            heading: 'What goes first on a medical resume?',
            paragraphs: [
              'The summary states your specialty, years of experience and area of interest. Right after it, list your license to practice and required registrations, since recruiters look for them first.',
            ],
          },
          {
            heading: 'How do I describe clinical experience?',
            paragraphs: [
              'For each post: the facility (hospital, clinic, practice), the ward or service, the dates and 3 to 5 bullets with volume and results. Illustrative example: "Cared for an average of 12 patients per shift on a 30-bed surgical ward and introduced a handover checklist."',
              'Do not include patient names or data that could identify them. Describe types of cases and leave the individuals out.',
            ],
          },
          {
            heading: 'Which training and skills matter?',
            paragraphs: ['List relevant courses, certifications and procedural skills:'],
            items: [
              'Continuing education courses and accreditations, with the year.',
              'Procedures and equipment used (for example monitoring, infusions, diagnostic equipment).',
              'Foreign languages, important for work abroad.',
              'Participation in studies, publications or conferences, if any.',
            ],
          },
          {
            heading: 'What mistakes do I avoid?',
            paragraphs: [
              'A resume that is too long, with every on-call shift and course listed, hides the essentials. Keep what shows your specialty and experience for the target role.',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I add a photo to a medical resume?',
            answer: 'It is optional. For applications abroad, follow local practice, which often leaves the photo out.',
          },
          {
            question: 'How long should it be?',
            answer: 'One or two pages. Publications and courses can go in a separate appendix if there are many.',
          },
          {
            question: 'How do I apply in another member state?',
            answer: 'Check the qualification recognition requirements and the language required by the employer and the local authority.',
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
        slug: 'cv-pentru-soferi-si-curieri',
        title: 'CV pentru șoferi și curieri: ghid practic',
        description: 'Cum scrii un CV de șofer sau curier: categorii de permis, atestate, experiență, rezultate și ce caută angajatorii.',
        answer:
          'Un CV de șofer sau curier pune în față categoriile permisului, atestatele (ADR, atestat profesional) și experiența, cu volum și rezultate: livrări pe zi, kilometri, rata de livrare la timp, zero incidente. Păstrează-l la o pagină, în ordine cronologică, cu datele de contact scrise clar.',
        sections: [
          {
            heading: 'Ce pun primul?',
            paragraphs: [
              'Categoriile permisului de conducere, atestatele și vechimea. Angajatorul verifică mai întâi dacă îndeplinești cerințele legale, apoi citește experiența.',
            ],
            items: [
              'Categorii de permis (B, C, CE etc.) și anul obținerii.',
              'Atestat profesional și, dacă ai, ADR sau alte autorizări.',
              'Experiență în oraș, pe distanțe lungi sau în transport internațional.',
            ],
          },
          {
            heading: 'Cum descriu experiența?',
            paragraphs: [
              'Pentru fiecare angajator: tipul de transport, vehiculele conduse, zona și rezultatele. Exemplu ilustrativ: „Am efectuat în medie 65 de livrări pe zi în Cluj-Napoca, cu rata de livrare la timp de 97% și fără incidente de marfă deteriorată în 2 ani.”',
            ],
          },
          {
            heading: 'Ce rezultate arată fiabilitatea?',
            paragraphs: [
              'Lipsa incidentelor, respectarea termenelor, consumul de combustibil redus prin condus eficient și buna folosire a aplicațiilor de livrare. Angajatorul caută oameni de încredere.',
            ],
          },
          {
            heading: 'Ce greșeli evit?',
            paragraphs: [
              'Un CV fără categoria permisului sau fără date de contact clare. Scrie telefonul în corpul paginii și ține documentul curat, fără tabele.',
            ],
          },
        ],
        faq: [
          {
            question: 'Trebuie să menționez amenzile sau incidentele?',
            answer: 'Nu le pui în CV. Fii pregătit să răspunzi onest dacă ești întrebat la interviu.',
          },
          {
            question: 'Pun salariul dorit în CV?',
            answer: 'Doar dacă anunțul îl cere. Altfel îl discuți la interviu.',
          },
          {
            question: 'Ajunge un CV de o pagină?',
            answer: 'Da. Informațiile esențiale (permis, atestate, experiență) se așază ușor pe o singură pagină.',
          },
        ],
      },
      en: {
        slug: 'resume-for-drivers-and-couriers',
        title: 'Resume for drivers and couriers: a practical guide',
        description: 'How to write a driver or courier resume: licence categories, certificates, experience, results and what employers look for.',
        answer:
          'A driver or courier resume leads with licence categories, certificates (such as ADR or professional certificate) and experience, with volume and results: deliveries per day, kilometres, on-time rate, zero incidents. Keep it to one page, in chronological order, with contact details written clearly.',
        sections: [
          {
            heading: 'What goes first?',
            paragraphs: [
              'Driving licence categories, certificates and years of experience. Employers first check that you meet the legal requirements, then read the experience.',
            ],
            items: [
              'Licence categories (B, C, CE and so on) and the year obtained.',
              'Professional certificate and, if you have them, ADR or other authorizations.',
              'City, long-distance or international transport experience.',
            ],
          },
          {
            heading: 'How do I describe experience?',
            paragraphs: [
              'For each employer: the type of transport, the vehicles driven, the area and the results. Illustrative example: "Completed an average of 65 deliveries a day in Cluj-Napoca, with a 97% on-time rate and no damaged-goods incidents in 2 years."',
            ],
          },
          {
            heading: 'Which results show reliability?',
            paragraphs: [
              'A clean incident record, met deadlines, fuel use reduced through efficient driving and good use of delivery apps. Employers look for people they can trust.',
            ],
          },
          {
            heading: 'What mistakes do I avoid?',
            paragraphs: [
              'A resume without the licence category or without clear contact details. Write your phone number in the body of the page and keep the document clean, with no tables.',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I mention fines or incidents?',
            answer: 'Leave them off the resume. Be ready to answer honestly if asked at the interview.',
          },
          {
            question: 'Do I put my expected salary on the resume?',
            answer: 'Only if the posting asks for it. Otherwise discuss it at the interview.',
          },
          {
            question: 'Is a one-page resume enough?',
            answer: 'Yes. The essentials (licence, certificates, experience) fit easily on a single page.',
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
        slug: 'cv-pentru-munca-in-uniunea-europeana',
        title: 'CV pentru a lucra într-o altă țară din UE',
        description: 'Cum adaptezi CV-ul pentru piețele din UE: limbă, format, recunoașterea diplomelor, date personale și diferențe între țări.',
        answer:
          'Pentru o altă țară din UE, scrie CV-ul în limba anunțului sau în engleză, pe un format simplu și cu datele locale (telefon cu prefix internațional, orașul). Verifică practicile țării: poza, data nașterii și starea civilă sunt cerute în unele locuri și omise în altele. Menționează recunoașterea diplomelor și nivelul limbii cu scara europeană.',
        sections: [
          {
            heading: 'În ce limbă scriu CV-ul?',
            paragraphs: [
              'Limba anunțului este alegerea sigură. Dacă anunțul este în engleză sau compania este internațională, engleza este potrivită. Evită traducerile automate neverificate: cere unui vorbitor nativ să citească textul.',
            ],
          },
          {
            heading: 'Ce diferă de la o țară la alta?',
            paragraphs: [
              'Practicile variază: unele piețe așteaptă o poză și date personale, altele le omit. Ca regulă, caută exemple de CV-uri din țara țintă sau întreabă un recrutor local, apoi adaptează.',
            ],
            items: [
              'Format de dată și de adresă după uzanța locală.',
              'Telefon cu prefix internațional (+40 pentru România).',
              'Lungimea: de obicei una sau două pagini.',
            ],
          },
          {
            heading: 'Cum arăt studiile și calificările?',
            paragraphs: [
              'Scrie denumirea diplomei în limba locală sau în engleză, cu explicația între paranteze, de exemplu „Licență în Informatică (Bachelor in Computer Science)”. Pentru profesii reglementate, verifică procedura de recunoaștere a calificării.',
            ],
          },
          {
            heading: 'Cum arăt nivelul de limbă?',
            paragraphs: [
              'Folosește scara europeană (A1-C2) și, dacă ai, certificările (IELTS, TOEFL, Goethe, DELF). Nivelul declarat trebuie să corespundă cu ce poți face la interviu.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pot folosi formatul Europass?',
            answer: 'Da, este recunoscut în UE. Pentru companii private, un CV modern pe o coloană este o alegere bună.',
          },
          {
            question: 'Am nevoie de viză sau permis de muncă în UE?',
            answer: 'Cetățenii UE pot, în general, să lucreze în alte state membre. Verifică formalitățile de înregistrare ale țării.',
          },
          {
            question: 'Cum găsesc anunțuri?',
            answer: 'Platforme de joburi locale, LinkedIn și portalul european de joburi. Folosește cuvintele cheie din limba locală.',
          },
        ],
      },
      en: {
        slug: 'resume-for-working-in-the-eu',
        title: 'How to write a resume for working in another EU country',
        description: 'How to adapt your resume for EU markets: language, format, recognition of diplomas, personal data and differences between countries.',
        answer:
          'For another EU country, write the resume in the language of the posting or in English, in a simple format with local details (phone with international prefix, city). Check the country\'s practice: a photo, date of birth and marital status are expected in some places and left out in others. State diploma recognition and language levels on the European scale.',
        sections: [
          {
            heading: 'Which language do I write it in?',
            paragraphs: [
              'The language of the posting is the safe choice. If the posting is in English or the company is international, English fits. Avoid unchecked machine translation: have a native speaker read the text.',
            ],
          },
          {
            heading: 'What differs from country to country?',
            paragraphs: [
              'Practices vary: some markets expect a photo and personal data, others leave them out. As a rule, look for resume examples from the target country or ask a local recruiter, then adapt.',
            ],
            items: [
              'Date and address formats following local use.',
              'Phone with international prefix (+40 for Romania).',
              'Length: usually one or two pages.',
            ],
          },
          {
            heading: 'How do I show studies and qualifications?',
            paragraphs: [
              'Write the diploma name in the local language or English with an explanation in brackets, for example "Licență in Computer Science (Bachelor in Computer Science)". For regulated professions, check the qualification recognition procedure.',
            ],
          },
          {
            heading: 'How do I show language level?',
            paragraphs: [
              'Use the European scale (A1-C2) and, if you have them, certificates (IELTS, TOEFL, Goethe, DELF). The declared level must match what you can do in an interview.',
            ],
          },
        ],
        faq: [
          {
            question: 'Can I use the Europass format?',
            answer: 'Yes, it is recognized across the EU. For private companies, a modern single-column resume is a good choice.',
          },
          {
            question: 'Do I need a visa or work permit in the EU?',
            answer: 'EU citizens can generally work in other member states. Check the country\'s registration formalities.',
          },
          {
            question: 'How do I find postings?',
            answer: 'Local job boards, LinkedIn and the European job portal. Use keywords in the local language.',
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
        slug: 'scrisoare-de-intentie-pentru-schimbare-de-cariera',
        title: 'Scrisoare de intenție pentru schimbare de carieră',
        description: 'Cum scrii o scrisoare de intenție când îți schimbi domeniul: povestea tranziției, competențe transferabile, dovezi și un exemplu.',
        answer:
          'Într-o scrisoare pentru schimbare de carieră, spui pe scurt de ce faci schimbarea, ce competențe transferabile aduci și ce dovezi ai pentru noul domeniu (proiecte, cursuri). Folosește primul paragraf pentru motivul tranziției, al doilea pentru o realizare relevantă și al treilea pentru potrivirea cu firma. Rămâi la 200-300 de cuvinte.',
        sections: [
          {
            heading: 'Cum explic motivul schimbării?',
            paragraphs: [
              'Într-o propoziție sau două, onest și pozitiv: ce te-a atras de noul domeniu și ce ai făcut deja în direcția asta. Evită criticile la adresa fostului domeniu sau angajator.',
            ],
          },
          {
            heading: 'Ce competențe transferabile aleg?',
            paragraphs: [
              'Alege două sau trei care apar în anunț: managementul proiectelor, comunicarea cu clienții, analiza datelor, instruirea altora. Pentru fiecare, un exemplu scurt cu rezultat.',
            ],
          },
          {
            heading: 'Ce dovezi arăt pentru noul domeniu?',
            paragraphs: [
              'Cursuri finalizate, certificări, un proiect personal, voluntariat. Un exemplu ilustrativ: „În ultimul an am finalizat un curs de analiză de date și am construit un tablou de bord pentru un ONG local, folosit lunar de 5 persoane.”',
            ],
          },
          {
            heading: 'Cum închei?',
            paragraphs: [
              'Cu disponibilitatea ta pentru un interviu și cu o propoziție care leagă experiența ta anterioară de nevoile echipei. Fii direct și politicos.',
            ],
          },
        ],
        faq: [
          {
            question: 'Menționez salariul mai mic dacă începi de la zero?',
            answer: 'Nu în scrisoare. Discuți așteptările financiare la interviu, în funcție de ofertă.',
          },
          {
            question: 'Pot folosi aceeași scrisoare pentru mai multe firme?',
            answer: 'Structura da, conținutul nu. Adaptează motivul și potrivirea pentru fiecare firmă.',
          },
          {
            question: 'Cât de mult din trecut includ?',
            answer: 'Doar ce se leagă de noul rol. Detaliile fără legătură rămân în CV.',
          },
        ],
      },
      en: {
        slug: 'cover-letter-for-a-career-change',
        title: 'Cover letter for a career change',
        description: 'How to write a cover letter when you change fields: the story of the transition, transferable skills, proof and an example.',
        answer:
          'In a career-change cover letter, you say briefly why you are changing, which transferable skills you bring and what proof you have for the new field (projects, courses). Use the first paragraph for the reason for the transition, the second for a relevant achievement and the third for the fit with the company. Stay at 200 to 300 words.',
        sections: [
          {
            heading: 'How do I explain the reason for the change?',
            paragraphs: [
              'In a sentence or two, honest and positive: what drew you to the new field and what you have already done in that direction. Avoid criticizing your former field or employer.',
            ],
          },
          {
            heading: 'Which transferable skills do I pick?',
            paragraphs: [
              'Pick two or three that appear in the posting: project management, client communication, data analysis, training others. For each, a short example with a result.',
            ],
          },
          {
            heading: 'What proof do I show for the new field?',
            paragraphs: [
              'Completed courses, certifications, a personal project, volunteering. Illustrative example: "Over the past year I completed a data analysis course and built a dashboard for a local nonprofit, used monthly by 5 people."',
            ],
          },
          {
            heading: 'How do I close?',
            paragraphs: [
              'With your availability for an interview and a sentence linking your previous experience to the team\'s needs. Be direct and polite.',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I mention a lower starting salary?',
            answer: 'Not in the letter. You discuss financial expectations in the interview, depending on the offer.',
          },
          {
            question: 'Can I reuse the same letter for several companies?',
            answer: 'The structure yes, the content no. Adapt the reason and the fit for each company.',
          },
          {
            question: 'How much of my past do I include?',
            answer: 'Only what ties to the new role. The unrelated detail stays on the resume.',
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
        slug: 'cum-negociezi-salariul',
        title: 'Cum negociezi salariul la un job nou',
        description: 'Pași practici pentru negocierea salariului: documentare, momentul potrivit, formularea cererii și ce faci când oferta e sub așteptări.',
        answer:
          'Negociază după ce ai primit oferta și după ce ți-ai documentat intervalul pieței pentru rol, oraș și experiență. Spune un interval argumentat cu realizările tale, cere pachetul complet (salariu, bonusuri, beneficii, zile libere) și rămâi politicos și flexibil. Nu da prima cifră dacă nu ți se cere.',
        sections: [
          {
            heading: 'Cum mă documentez?',
            paragraphs: [
              'Caută intervale de salarii pentru rolul tău în anunțuri cu salariu afișat, în sondaje salariale publice și întreabă colegi din domeniu. Notează un interval realist, cu o limită minimă sub care nu accepți.',
            ],
          },
          {
            heading: 'Când negociez?',
            paragraphs: [
              'După oferta formală, când angajatorul și-a exprimat clar interesul. Dacă ți se cere o așteptare mai devreme, dă un interval și spune că depinde de pachetul complet.',
            ],
          },
          {
            heading: 'Cum formulez cererea?',
            paragraphs: [
              'Exemplu ilustrativ: „Mulțumesc pentru ofertă, sunt entuziasmat de rol. Pe baza experienței mele de 6 ani și a rezultatelor din ultimul post, mă aștept la un interval între X și Y. Putem discuta pachetul complet?” Folosește doar cifre reale.',
            ],
          },
          {
            heading: 'Ce fac dacă oferta e sub așteptări?',
            paragraphs: [
              'Cere detalii despre bonusuri, beneficii, program flexibil, buget de formare și un moment de reevaluare (după 6 luni). Dacă diferența rămâne mare, decide dacă rolul merită altfel.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pun salariul dorit în CV?',
            answer: 'Doar dacă anunțul o cere explicit. Altfel îl discuți la interviu sau în etapa de ofertă.',
          },
          {
            question: 'Pot pierde oferta dacă negociez?',
            answer: 'O negociere politicoasă și argumentată este obișnuită. Riscul este mic dacă rămâi respectuos.',
          },
          {
            question: 'Cum aflu intervalul pieței?',
            answer: 'Din anunțuri cu salariu afișat, sondaje publice și discuții cu persoane din domeniu.',
          },
        ],
      },
      en: {
        slug: 'how-to-negotiate-salary',
        title: 'How to negotiate salary for a new job',
        description: 'Practical steps for salary negotiation: research, the right moment, phrasing the request and what to do when the offer is below expectations.',
        answer:
          'Negotiate after you receive the offer and after you have researched the market range for the role, city and experience. State a range backed by your achievements, ask for the full package (salary, bonuses, benefits, time off) and stay polite and flexible. Do not name the first number unless asked.',
        sections: [
          {
            heading: 'How do I research?',
            paragraphs: [
              'Look up salary ranges for your role in postings that show pay, in public salary surveys, and ask peers in the field. Note a realistic range, with a floor below which you will not accept.',
            ],
          },
          {
            heading: 'When do I negotiate?',
            paragraphs: [
              'After the formal offer, when the employer has clearly shown interest. If you are asked for an expectation earlier, give a range and say it depends on the full package.',
            ],
          },
          {
            heading: 'How do I phrase the request?',
            paragraphs: [
              'Illustrative example: "Thank you for the offer, I am excited about the role. Based on my 6 years of experience and the results in my last role, I am looking for a range between X and Y. Can we discuss the full package?" Use only real figures.',
            ],
          },
          {
            heading: 'What if the offer is below expectations?',
            paragraphs: [
              'Ask about bonuses, benefits, flexible hours, a training budget and a review point (after 6 months). If the gap stays large, decide whether the role is worth it otherwise.',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I put my desired salary on the resume?',
            answer: 'Only if the posting explicitly asks for it. Otherwise discuss it at the interview or in the offer stage.',
          },
          {
            question: 'Can I lose the offer by negotiating?',
            answer: 'A polite, reasoned negotiation is common. The risk is low if you stay respectful.',
          },
          {
            question: 'How do I find the market range?',
            answer: 'From postings showing salary, public surveys and conversations with people in the field.',
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
        slug: 'media-si-notele-in-cv',
        title: 'Media și notele în CV: când le pui și cum',
        description: 'Când are sens să incluzi media sau notele în CV, cum le formulezi, ce alternative ai și cum tratezi un rezultat slab.',
        answer:
          'Include media doar când este un avantaj clar și recentă (la început de carieră, de obicei peste un prag bun în domeniu) sau când anunțul o cere. Scrie-o cu scara („9,40 din 10”) și, dacă nu e bună, pune în loc proiecte, premii sau cursuri relevante. După câțiva ani de experiență, media dispare din CV.',
        sections: [
          {
            heading: 'Când pun media în CV?',
            paragraphs: [
              'La începutul carierei, când nu ai experiență relevantă, și când media este un punct forte (de exemplu o medie ridicată la absolvire). Unele programe de internship sau companii o cer explicit.',
            ],
          },
          {
            heading: 'Cum o scriu?',
            paragraphs: [
              'Cu scara completă și anul: „Media de absolvire: 9,40 / 10, 2025”. Poți adăuga clasamentul sau mențiunile, dacă au fost reale. Pentru studii în străinătate, menționează scara locală.',
            ],
          },
          {
            heading: 'Ce pun dacă media nu e bună?',
            paragraphs: ['Omite-o și pune în locul ei dovezi mai puternice:'],
            items: [
              'Proiecte de la facultate cu rezultate concrete.',
              'Premii, burse, concursuri, olimpiade.',
              'Practică, voluntariat și cursuri extra relevante pentru post.',
            ],
          },
          {
            heading: 'Ce se întâmplă mai târziu în carieră?',
            paragraphs: [
              'După 2-3 ani de experiență, media pierde importanță, iar locul ei îl iau realizările profesionale. Scoate-o și folosește spațiul pentru rezultate de la locul de muncă.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pot să omit media dacă anunțul nu o cere?',
            answer: 'Da. Dacă ți se cere la interviu sau la o etapă ulterioară, o spui onest.',
          },
          {
            question: 'Notele din liceu își au locul în CV?',
            answer: 'De regulă nu, decât pentru un student în primul an sau pentru un anunț care o cere.',
          },
          {
            question: 'Cum arăt un rezultat în alt sistem de notare?',
            answer: 'Scrie nota cu scara locală și, dacă e util, echivalentul aproximativ, marcat ca atare.',
          },
        ],
      },
      en: {
        slug: 'grades-and-gpa-on-resume',
        title: 'Grades and GPA on a resume: when and how',
        description: 'When it makes sense to include your grades or GPA, how to phrase them, what alternatives you have and how to handle a weak result.',
        answer:
          'Include your GPA only when it is a clear and recent strength (early in your career, usually above a good threshold for the field) or when the posting asks for it. Write it with the scale ("9.40 out of 10") and, if it is not strong, put projects, awards or relevant courses instead. After a few years of experience, the GPA drops off the resume.',
        sections: [
          {
            heading: 'When do I put my GPA on the resume?',
            paragraphs: [
              'Early in your career, when you lack relevant experience and the GPA is a strength (for example a high graduation average). Some internship programs and companies ask for it explicitly.',
            ],
          },
          {
            heading: 'How do I write it?',
            paragraphs: [
              'With the full scale and the year: "Graduation GPA: 9.40 / 10, 2025". You can add class ranking or honors if they were real. For studies abroad, state the local scale.',
            ],
          },
          {
            heading: 'What do I put if it is not strong?',
            paragraphs: ['Leave it out and put stronger proof in its place:'],
            items: [
              'University projects with concrete results.',
              'Awards, scholarships, competitions, olympiads.',
              'Internships, volunteering and extra courses relevant to the role.',
            ],
          },
          {
            heading: 'What happens later in my career?',
            paragraphs: [
              'After 2 or 3 years of experience, the GPA matters less and professional achievements take its place. Remove it and use the space for results from work.',
            ],
          },
        ],
        faq: [
          {
            question: 'Can I leave it out if the posting does not ask?',
            answer: 'Yes. If you are asked at the interview or a later stage, say it honestly.',
          },
          {
            question: 'Do high school grades belong on a resume?',
            answer: 'Usually not, except for a first-year student or a posting that asks for them.',
          },
          {
            question: 'How do I show a result in another grading system?',
            answer: 'Write the grade with the local scale and, if useful, an approximate equivalent, marked as such.',
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
        slug: 'cv-pentru-ingineri',
        title: 'CV pentru ingineri: structură, proiecte și rezultate',
        description: 'Cum scrii un CV de inginer: proiecte cu metrici, unelte și standarde, certificări, structură și greșeli frecvente.',
        answer:
          'Un CV de inginer se construiește pe proiecte cu rezultate măsurabile (cost, timp, performanță, calitate), unelte și standarde folosite și responsabilități clare. Pune rezumatul tehnic și competențele cheie sus, apoi experiența cu 3-5 puncte pe post. Încheie cu certificări și educație și păstrează o pagină sau două.',
        sections: [
          {
            heading: 'Cum descriu un proiect inginerească?',
            paragraphs: [
              'Folosește schema context, acțiune, rezultat: ce problemă ai rezolvat, cu ce metodă sau unealtă, și ce s-a schimbat în cifre. Exemplu ilustrativ: „Am optimizat parametrii unei linii de ambalare, crescând productivitatea cu 14% și reducând rebuturile de la 2,1% la 1,2%.”',
            ],
          },
          {
            heading: 'Ce unelte și standarde menționez?',
            paragraphs: [
              'Numește programele (SolidWorks, AutoCAD, MATLAB, SAP), metodele (Lean, Six Sigma, FMEA) și standardele respectate (ISO 9001, CE). Reia formularea din anunț.',
            ],
          },
          {
            heading: 'Cum arăt competențele fără să fac o listă lungă?',
            paragraphs: [
              'Grupează-le pe categorii (proiectare, analiză, producție, management) și pune nivelul în cuvinte. Păstrează 8-12 competențe relevante pentru post.',
            ],
          },
          {
            heading: 'Ce greșeli evit?',
            paragraphs: [
              'Descrieri de responsabilități fără cifre, liste lungi de programe fără proiecte și absența certificărilor relevante. Un CV tehnic clar câștigă în fața unuia încărcat.',
            ],
          },
        ],
        faq: [
          {
            question: 'Pun proiectul de diplomă în CV?',
            answer: 'Da, la început de carieră, cu tema, metoda și rezultatul. După câțiva ani, proiectele profesionale îi iau locul.',
          },
          {
            question: 'Cât de tehnic să fiu?',
            answer: 'Suficient pentru ca un inginer să înțeleagă, dar clar pentru un recrutor. Explică un termen rar, scurt, între paranteze.',
          },
          {
            question: 'Sunt importante certificările?',
            answer: 'Da, mai ales cele recunoscute în domeniu (PMP, Six Sigma, certificări de producător). Pune-le cu anul.',
          },
        ],
      },
      en: {
        slug: 'engineer-resume',
        title: 'Engineer resume: structure, projects and results',
        description: 'How to write an engineer resume: projects with metrics, tools and standards, certifications, structure and common mistakes.',
        answer:
          'An engineer resume is built on projects with measurable results (cost, time, performance, quality), the tools and standards used and clear responsibilities. Put the technical summary and key skills at the top, then experience with 3 to 5 bullets per job. Finish with certifications and education and keep it to one or two pages.',
        sections: [
          {
            heading: 'How do I describe an engineering project?',
            paragraphs: [
              'Use the context, action, result pattern: what problem you solved, with which method or tool, and what changed in numbers. Illustrative example: "Optimized the parameters of a packaging line, raising productivity by 14% and cutting scrap from 2.1% to 1.2%."',
            ],
          },
          {
            heading: 'Which tools and standards do I mention?',
            paragraphs: [
              'Name the software (SolidWorks, AutoCAD, MATLAB, SAP), the methods (Lean, Six Sigma, FMEA) and the standards followed (ISO 9001, CE). Reuse the posting\'s wording.',
            ],
          },
          {
            heading: 'How do I show skills without a long list?',
            paragraphs: [
              'Group them by category (design, analysis, production, management) and write the level in words. Keep 8 to 12 skills relevant to the role.',
            ],
          },
          {
            heading: 'What mistakes do I avoid?',
            paragraphs: [
              'Responsibility descriptions without numbers, long software lists without projects and missing relevant certifications. A clear technical resume beats a cluttered one.',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I put my thesis project on the resume?',
            answer: 'Yes, early in your career, with the topic, the method and the result. After a few years, professional projects take its place.',
          },
          {
            question: 'How technical should I be?',
            answer: 'Enough for an engineer to follow, but clear to a recruiter. Explain a rare term briefly in brackets.',
          },
          {
            question: 'Do certifications matter?',
            answer: 'Yes, especially those recognized in the field (PMP, Six Sigma, vendor certifications). List them with the year.',
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
        slug: 'cv-pentru-studenti-si-programe-erasmus',
        title: 'CV pentru studenți și programe Erasmus',
        description: 'Cum scrii CV-ul de student pentru practică, internship sau Erasmus: educație, proiecte, limbi străine, motivația și o structură simplă.',
        answer:
          'CV-ul de student pune educația și proiectele în față, apoi practica, voluntariatul, competențele și limbile străine. Pentru Erasmus sau internship, adaugă motivația în rezumat și nivelul de limbă cu scara europeană. Păstrează o pagină, pe o singură coloană, și folosește exemple concrete cu rezultate, chiar și din proiecte de facultate.',
        sections: [
          {
            heading: 'Cum structurez un CV de student?',
            paragraphs: [
              'Ordinea recomandată: date de contact, rezumat, educație (facultate, specializare, perioada, media dacă e bună), proiecte, practică sau voluntariat, competențe, limbi străine.',
            ],
          },
          {
            heading: 'Ce proiecte pun?',
            paragraphs: [
              'Cele mai apropiate de ce cauți: un proiect de echipă, o lucrare, un eveniment organizat, un concurs. Scrie ce ai făcut tu, cu ce unelte și ce a ieșit. Exemplu ilustrativ: „Am coordonat o echipă de 5 colegi într-un proiect de analiză a datelor cu Python și am prezentat rezultatele în fața a 40 de persoane.”',
            ],
          },
          {
            heading: 'Ce adaug pentru Erasmus?',
            paragraphs: [
              'Nivelul limbii străine cu scara europeană (B1, B2, C1), motivația în rezumat și experiențe care arată adaptabilitate: voluntariat, proiecte internaționale, activități într-un mediu nou. Verifică formatul cerut de universitate (adesea Europass).',
            ],
          },
          {
            heading: 'Cum fac CV-ul să iasă în evidență?',
            paragraphs: [
              'Cu realizări măsurabile și un format curat. Un proiect cu rezultat convinge mai mult decât o listă lungă de calități.',
            ],
          },
        ],
        faq: [
          {
            question: 'Cât de lung este un CV de student?',
            answer: 'O pagină. Nu ai nevoie de mai mult la început de carieră.',
          },
          {
            question: 'Includ hobby-uri?',
            answer: 'Doar dacă arată o calitate relevantă pentru program sau post, de exemplu organizarea de evenimente.',
          },
          {
            question: 'Trebuie să fie în engleză pentru Erasmus?',
            answer: 'Verifică cerința universității gazdă. De obicei se cere engleza sau limba programului.',
          },
        ],
      },
      en: {
        slug: 'student-and-erasmus-resume',
        title: 'Resume for students and Erasmus programs',
        description: 'How to write a student resume for an internship, work placement or Erasmus: education, projects, languages, motivation and a simple structure.',
        answer:
          'A student resume puts education and projects first, then internships, volunteering, skills and languages. For Erasmus or an internship, add motivation to the summary and your language level on the European scale. Keep it to one page, on a single column, and use concrete examples with results, even from university projects.',
        sections: [
          {
            heading: 'How do I structure a student resume?',
            paragraphs: [
              'The recommended order: contact details, summary, education (university, major, dates, GPA if strong), projects, internship or volunteering, skills, languages.',
            ],
          },
          {
            heading: 'Which projects do I include?',
            paragraphs: [
              'The ones closest to what you are looking for: a team project, a thesis, an event you organized, a competition. Write what you did yourself, with which tools and what came out of it. Illustrative example: "Coordinated a team of 5 peers on a data analysis project in Python and presented the results to 40 people."',
            ],
          },
          {
            heading: 'What do I add for Erasmus?',
            paragraphs: [
              'Your foreign language level on the European scale (B1, B2, C1), motivation in the summary and experiences that show adaptability: volunteering, international projects, activities in a new environment. Check the format your university requires (often Europass).',
            ],
          },
          {
            heading: 'How do I make the resume stand out?',
            paragraphs: [
              'With measurable achievements and a clean format. A project with a result convinces more than a long list of qualities.',
            ],
          },
        ],
        faq: [
          {
            question: 'How long is a student resume?',
            answer: 'One page. You do not need more early in your career.',
          },
          {
            question: 'Do I include hobbies?',
            answer: 'Only if they show a quality relevant to the program or role, for example organizing events.',
          },
          {
            question: 'Must it be in English for Erasmus?',
            answer: 'Check the host university requirement. English or the program language is usually requested.',
          },
        ],
      },
    },
  },
]
