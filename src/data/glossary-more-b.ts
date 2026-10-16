// Glossary terms 15-20. Same model as glossary.ts. Copy rules: no em dashes, no "X, not Y"
// phrasing, no invented statistics.
import type { Guide, GuideContent } from './guides'

const DATE = '2026-10-16'

const term = (ro: GuideContent, en: GuideContent): Guide => ({
  kind: 'glossary',
  datePublished: DATE,
  dateModified: DATE,
  content: { ro, en },
})

export const GLOSSARY_MORE_B: Guide[] = [
  term(
    {
      slug: 'ce-sunt-okr-urile',
      title: 'Ce sunt OKR-urile?',
      description: 'OKR înseamnă Objectives and Key Results, o metodă de stabilire a obiectivelor. Cum funcționează și cum le menționezi în CV.',
      answer:
        'OKR (Objectives and Key Results) este o metodă de a stabili obiective: un obiectiv calitativ și 2-5 rezultate cheie măsurabile, revizuite periodic, de obicei trimestrial. În CV poți menționa OKR-urile atunci când ai atins sau ai definit obiective într-o echipă care le folosește.',
      sections: [
        {
          heading: 'Cum arată un OKR?',
          paragraphs: [
            'Exemplu ilustrativ. Obiectiv: „Să îmbunătățim experiența de suport”. Rezultate cheie: „Timp mediu de prim răspuns sub 15 minute”, „CSAT peste 95%”, „Reducerea tichetelor repetitive cu 20%”.',
          ],
        },
        {
          heading: 'Cum îl pun în CV?',
          paragraphs: [
            'Leagă un punct de un rezultat cheie: „Am atins 3 din 4 rezultate cheie trimestriale pentru echipa de suport, reducând timpul de prim răspuns cu 40%.”',
          ],
        },
      ],
      faq: [
        {
          question: 'Care e diferența dintre OKR și KPI?',
          answer: 'KPI măsoară performanța curentă a unei activități, iar OKR stabilește un obiectiv de schimbare într-o perioadă.',
        },
        {
          question: 'Toate companiile folosesc OKR?',
          answer: 'Nu. Sunt folosite mai ales în companii de tehnologie și în echipe care lucrează pe obiective trimestriale.',
        },
      ],
    },
    {
      slug: 'what-are-okrs',
      title: 'What are OKRs?',
      description: 'OKR stands for Objectives and Key Results, a goal-setting method. How it works and how to mention it on a resume.',
      answer:
        'OKR (Objectives and Key Results) is a goal-setting method: one qualitative objective and 2 to 5 measurable key results, reviewed periodically, usually quarterly. On a resume you can mention OKRs when you reached or defined goals in a team that uses them.',
      sections: [
        {
          heading: 'What does an OKR look like?',
          paragraphs: [
            'Illustrative example. Objective: "Improve the support experience". Key results: "Average first response time under 15 minutes", "CSAT above 95%", "Cut repetitive tickets by 20%".',
          ],
        },
        {
          heading: 'How do I put one on a resume?',
          paragraphs: [
            'Tie a bullet to a key result: "Hit 3 of 4 quarterly key results for the support team, cutting first response time by 40%."',
          ],
        },
      ],
      faq: [
        {
          question: 'What is the difference between OKR and KPI?',
          answer: 'A KPI measures the current performance of an activity, while an OKR sets a goal for change over a period.',
        },
        {
          question: 'Do all companies use OKRs?',
          answer: 'No. They are used mostly by tech companies and by teams working on quarterly goals.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'ats-sau-crm',
      title: 'ATS sau CRM: care este diferența?',
      description: 'Diferența dintre un ATS (recrutare) și un CRM (relația cu clienții), cum se folosesc și ce înseamnă pentru candidați.',
      answer:
        'ATS (Applicant Tracking System) gestionează candidaturile și procesul de recrutare, iar CRM (Customer Relationship Management) gestionează relația cu clienții și vânzările. Un recrutor poate folosi și un CRM de recrutare pentru relația cu candidații din baza de date, dar candidatura ta intră, de obicei, într-un ATS.',
      sections: [
        {
          heading: 'Ce face fiecare?',
          paragraphs: [
            'ATS: primește CV-uri, le organizează pe posturi, permite căutare și filtrare, urmărește etapele (interviu, ofertă). CRM: ține contactele clienților, istoricul comunicării și oportunitățile de vânzare.',
          ],
        },
        {
          heading: 'Ce înseamnă pentru CV-ul meu?',
          paragraphs: [
            'Dacă ai lucrat cu un CRM (HubSpot, Salesforce), menționează-l la competențe și la experiență. Pentru candidatură, CV-ul tău trebuie să fie ușor de citit de un ATS.',
          ],
        },
      ],
      faq: [
        {
          question: 'Folosesc recrutorii un CRM?',
          answer: 'Unii folosesc un CRM de recrutare sau funcții de CRM în ATS pentru a ține legătura cu candidații pe termen lung.',
        },
        {
          question: 'Cum arăt că știu un CRM?',
          answer: 'Pune numele exact al uneltei și un rezultat: „Am gestionat un pipeline de 120 de lead-uri în HubSpot.”',
        },
      ],
    },
    {
      slug: 'ats-vs-crm',
      title: 'ATS vs CRM: what is the difference?',
      description: 'The difference between an ATS (recruiting) and a CRM (customer relationships), how each is used and what it means for candidates.',
      answer:
        'An ATS (Applicant Tracking System) manages applications and the hiring process, while a CRM (Customer Relationship Management) manages customer relationships and sales. A recruiter may also use a recruiting CRM for relationships with candidates in a database, but your application usually goes into an ATS.',
      sections: [
        {
          heading: 'What does each do?',
          paragraphs: [
            'ATS: receives resumes, organizes them by role, allows search and filtering, tracks stages (interview, offer). CRM: keeps customer contacts, communication history and sales opportunities.',
          ],
        },
        {
          heading: 'What does it mean for my resume?',
          paragraphs: [
            'If you have worked with a CRM (HubSpot, Salesforce), mention it under skills and experience. For applying, your resume must be easy for an ATS to read.',
          ],
        },
      ],
      faq: [
        {
          question: 'Do recruiters use a CRM?',
          answer: 'Some use a recruiting CRM or CRM features inside the ATS to stay in touch with candidates long term.',
        },
        {
          question: 'How do I show that I know a CRM?',
          answer: 'Put the exact tool name and a result: "Managed a pipeline of 120 leads in HubSpot."',
        },
      ],
    },
  ),
  term(
    {
      slug: 'employer-branding',
      title: 'Ce este employer branding-ul?',
      description: 'Employer branding este imaginea unei companii ca angajator. Cum o influențează și cum îți ajută cercetarea ca viitor angajat.',
      answer:
        'Employer branding este imaginea unei companii ca angajator: cum o percep angajații actuali, foștii angajați și candidații. Include cultura, beneficiile, oportunitățile de dezvoltare și modul în care firma comunică despre ea. Ca să alegi un loc de muncă, caută recenzii, profiluri de angajați și anunțuri.',
      sections: [
        {
          heading: 'Cum evaluez employer branding-ul unei firme?',
          paragraphs: [
            'Citește recenzii de pe platforme de angajatori, uită-te la paginile de carieră și la profilurile LinkedIn ale angajaților și discută, dacă poți, cu persoane care lucrează sau au lucrat acolo.',
          ],
        },
        {
          heading: 'Cum îl menționez în CV?',
          paragraphs: [
            'Dacă ai lucrat la campanii de employer branding: „Am coordonat o campanie de angajare care a dublat numărul de candidaturi relevante în 4 luni.”',
          ],
        },
      ],
      faq: [
        {
          question: 'Este același lucru cu brandul companiei?',
          answer: 'Se leagă, dar employer branding se referă la imaginea firmei ca loc de muncă și depășește imaginea de furnizor de produse sau servicii.',
        },
        {
          question: 'Cine se ocupă de employer branding?',
          answer: 'De obicei echipa de HR împreună cu marketing și comunicare.',
        },
      ],
    },
    {
      slug: 'what-is-employer-branding',
      title: 'What is employer branding?',
      description: 'Employer branding is a company\'s image as an employer. How it forms and how it helps your research as a prospective employee.',
      answer:
        'Employer branding is a company\'s image as an employer: how current employees, former employees and candidates perceive it. It covers culture, benefits, development opportunities and how the company communicates about itself. To choose a workplace, look at reviews, employee profiles and postings.',
      sections: [
        {
          heading: 'How do I assess a company\'s employer brand?',
          paragraphs: [
            'Read reviews on employer review platforms, look at career pages and employees\' LinkedIn profiles and, if you can, talk to people who work or used to work there.',
          ],
        },
        {
          heading: 'How do I mention it on a resume?',
          paragraphs: [
            'If you worked on employer branding campaigns: "Coordinated a recruiting campaign that doubled relevant applications in 4 months."',
          ],
        },
      ],
      faq: [
        {
          question: 'Is it the same as the company brand?',
          answer: 'They are related, but employer branding covers the company\'s image as a workplace and goes beyond its image as a provider of products or services.',
        },
        {
          question: 'Who handles employer branding?',
          answer: 'Usually the HR team together with marketing and communications.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'recomandare-interna-angajare',
      title: 'Ce este angajarea prin recomandare internă (referral)?',
      description: 'Recomandarea internă este când un angajat al firmei propune un candidat. Cum funcționează și cum o folosești corect.',
      answer:
        'Recomandarea internă (employee referral) este situația în care un angajat al firmei propune un candidat pentru un post deschis. Recrutorii o apreciază, pentru că vine cu un context de încredere. Cere recomandarea unei persoane care îți cunoaște munca și trimite-i CV-ul actualizat și anunțul vizat.',
      sections: [
        {
          heading: 'Cum cer o recomandare?',
          paragraphs: [
            'Scrie un mesaj scurt: postul, de ce te potrivești, CV-ul atașat și o întrebare clară. Respectă răspunsul persoanei, mai ales dacă preferă să nu recomande.',
          ],
        },
        {
          heading: 'Ce urmează după?',
          paragraphs: [
            'De obicei aplici și prin canalul oficial, iar recomandarea este atașată sau menționată. Păstrează legătura cu persoana care te-a recomandat și mulțumește-i, indiferent de rezultat.',
          ],
        },
      ],
      faq: [
        {
          question: 'Garantează o recomandare un interviu?',
          answer: 'Nu. Crește vizibilitatea candidaturii, dar potrivirea cu postul rămâne decisivă.',
        },
        {
          question: 'Cum găsesc persoane care pot recomanda?',
          answer: 'În rețeaua ta profesională, pe LinkedIn și în comunitățile domeniului. Alege firme unde cunoști pe cineva.',
        },
      ],
    },
    {
      slug: 'what-is-an-employee-referral',
      title: 'What is an employee referral?',
      description: 'An employee referral is when a company employee recommends a candidate. How it works and how to use it properly.',
      answer:
        'An employee referral is when a company employee recommends a candidate for an open role. Recruiters value it because it comes with a context of trust. Ask for a referral from someone who knows your work and send them your updated resume and the target posting.',
      sections: [
        {
          heading: 'How do I ask for a referral?',
          paragraphs: [
            'Write a short message: the role, why you fit, your resume attached and a clear question. Respect the person\'s answer, especially if they prefer not to refer.',
          ],
        },
        {
          heading: 'What happens next?',
          paragraphs: [
            'You usually also apply through the official channel, with the referral attached or mentioned. Keep in touch with the person who referred you and thank them regardless of the outcome.',
          ],
        },
      ],
      faq: [
        {
          question: 'Does a referral guarantee an interview?',
          answer: 'No. It raises the visibility of the application, but the fit with the role stays decisive.',
        },
        {
          question: 'How do I find people who can refer me?',
          answer: 'In your professional network, on LinkedIn and in field communities. Pick companies where you know someone.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'interviu-structurat',
      title: 'Ce este un interviu structurat?',
      description: 'Interviul structurat folosește aceleași întrebări pentru toți candidații, cu criterii de evaluare clare. Cum te pregătești.',
      answer:
        'Interviul structurat este un interviu în care toți candidații primesc aceleași întrebări, în aceeași ordine, evaluate după criterii stabilite dinainte. Se bazează de obicei pe întrebări despre situații din trecut („Povestește-mi despre o dată când...”). Te pregătești cu exemple concrete din experiența ta.',
      sections: [
        {
          heading: 'Cum răspund la întrebările comportamentale?',
          paragraphs: [
            'Folosește schema situație, sarcină, acțiune, rezultat (STAR). Exemplu ilustrativ: o situație cu un client nemulțumit, ce responsabilitate ai avut, ce ai făcut și ce s-a întâmplat în final, cu un număr dacă există.',
          ],
        },
        {
          heading: 'Cum mă pregătesc?',
          paragraphs: [
            'Alege 5-6 exemple din experiență care acoperă lucrul în echipă, conflict, rezultate, învățare din greșeli și conducere. Exersează-le cu voce tare, în 1-2 minute fiecare.',
          ],
        },
      ],
      faq: [
        {
          question: 'De ce folosesc firmele interviuri structurate?',
          answer: 'Pentru că fac comparația între candidați mai corectă și mai ușor de justificat.',
        },
        {
          question: 'Pot citi răspunsurile?',
          answer: 'Notițele scurte sunt în regulă. Răspunsurile citite integral par rigide, deci exersează formularea.',
        },
      ],
    },
    {
      slug: 'what-is-a-structured-interview',
      title: 'What is a structured interview?',
      description: 'A structured interview uses the same questions for every candidate with clear evaluation criteria. How to prepare.',
      answer:
        'A structured interview is one where every candidate gets the same questions, in the same order, scored against criteria set in advance. It usually relies on questions about past situations ("Tell me about a time when..."). You prepare with concrete examples from your experience.',
      sections: [
        {
          heading: 'How do I answer behavioral questions?',
          paragraphs: [
            'Use the situation, task, action, result pattern (STAR). Illustrative example: a situation with an unhappy customer, what your responsibility was, what you did and what happened in the end, with a number if there is one.',
          ],
        },
        {
          heading: 'How do I prepare?',
          paragraphs: [
            'Pick 5 or 6 examples from your experience covering teamwork, conflict, results, learning from mistakes and leadership. Practice them aloud, 1 to 2 minutes each.',
          ],
        },
      ],
      faq: [
        {
          question: 'Why do companies use structured interviews?',
          answer: 'Because they make comparisons between candidates fairer and easier to justify.',
        },
        {
          question: 'Can I read my answers?',
          answer: 'Short notes are fine. Answers read in full sound stiff, so practice the phrasing.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'ce-este-o-scrisoare-de-intentie',
      title: 'Ce este o scrisoare de intenție?',
      description: 'Scrisoarea de intenție este documentul care însoțește CV-ul și explică de ce aplici. Ce conține și cum o scrii.',
      answer:
        'Scrisoarea de intenție este un document scurt care însoțește CV-ul și explică de ce aplici pentru un post și de ce te potrivești. Are de obicei 200-300 de cuvinte, în patru părți: deschidere, dovadă, potrivire cu firma și încheiere. O scrii separat pentru fiecare post.',
      sections: [
        {
          heading: 'Ce nu repet din CV?',
          paragraphs: [
            'Lista de sarcini. Scrisoarea aduce context: motivația, o realizare povestită pe scurt și legătura cu firma. Pentru o structură detaliată, vezi ghidul nostru despre scrisoarea în 4 paragrafe.',
          ],
        },
        {
          heading: 'Când este necesară?',
          paragraphs: [
            'Când anunțul o cere explicit și, în multe cazuri, când este opțională dar vrei să te diferențiezi, mai ales dacă schimbi domeniul sau aplici la început de carieră.',
          ],
        },
      ],
      faq: [
        {
          question: 'Este același lucru cu scrisoarea de motivație?',
          answer: 'Da, în limbajul curent. Ambele denumiri se referă la același tip de document.',
        },
        {
          question: 'Cum o trimit?',
          answer: 'Ca PDF cu text selectabil, alături de CV, sau lipită în câmpul platformei, dacă ți se cere.',
        },
      ],
    },
    {
      slug: 'what-is-a-cover-letter',
      title: 'What is a cover letter?',
      description: 'A cover letter is the document that accompanies your resume and explains why you apply. What it contains and how to write it.',
      answer:
        'A cover letter is a short document that accompanies your resume and explains why you are applying for a role and why you fit. It is usually 200 to 300 words, in four parts: opening, proof, fit with the company and close. You write it separately for each role.',
      sections: [
        {
          heading: 'What do I avoid repeating from the resume?',
          paragraphs: [
            'The task list. The letter adds context: motivation, one achievement told briefly and the link to the company. For a detailed structure, see our guide on the four-paragraph cover letter.',
          ],
        },
        {
          heading: 'When is it needed?',
          paragraphs: [
            'When the posting asks for it explicitly and, in many cases, when it is optional but you want to stand out, especially if you change fields or apply early in your career.',
          ],
        },
      ],
      faq: [
        {
          question: 'Is it the same as a motivation letter?',
          answer: 'In everyday use, yes. Both names refer to the same type of document.',
        },
        {
          question: 'How do I send it?',
          answer: 'As a PDF with selectable text next to the resume, or pasted into the platform field if asked.',
        },
      ],
    },
  ),
]
