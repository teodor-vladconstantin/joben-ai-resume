// Glossary terms 9-14. Same model as glossary.ts. Copy rules: no em dashes, no "X, not Y"
// phrasing, no invented statistics. Legal topics point readers to the law in force.
import type { Guide, GuideContent } from './guides'

const DATE = '2026-10-16'

const term = (ro: GuideContent, en: GuideContent): Guide => ({
  kind: 'glossary',
  datePublished: DATE,
  dateModified: DATE,
  content: { ro, en },
})

export const GLOSSARY_MORE: Guide[] = [
  term(
    {
      slug: 'ce-este-un-kpi',
      title: 'Ce este un KPI și cum îl pui în CV?',
      description: 'KPI înseamnă Key Performance Indicator, un indicator de performanță. Exemple pe domenii și cum îi folosești în punctele din CV.',
      answer:
        'KPI (Key Performance Indicator) este un indicator măsurabil care arată cât de bine merge o activitate: vânzări lunare, timp de răspuns, rata de conversie, satisfacția clienților. În CV, un KPI transformă un punct vag într-o dovadă: spui ce ai influențat și cu cât.',
      sections: [
        {
          heading: 'Ce KPI-uri apar în CV?',
          paragraphs: [
            'Depind de domeniu: vânzări (target atins, valoarea vânzărilor), suport (CSAT, timp de prim răspuns), marketing (cost per lead, rată de conversie), producție (rebuturi, timp de ciclu), HR (time-to-hire).',
          ],
        },
        {
          heading: 'Cum îl scriu într-un punct?',
          paragraphs: [
            'Schema: verb + ce ai făcut + KPI înainte și după. Exemplu ilustrativ: „Am redus timpul mediu de prim răspuns de la 45 la 12 minute prin reorganizarea cozii de tichete.”',
          ],
        },
      ],
      faq: [
        {
          question: 'Ce fac dacă nu cunosc cifrele exacte?',
          answer: 'Folosește o estimare onestă cu un interval („aproximativ 40 de clienți pe zi”) și evită cifrele inventate.',
        },
        {
          question: 'Pot folosi KPI confidențiali?',
          answer: 'Folosește procente și ordine de mărime în loc de sume exacte, dacă cifrele companiei sunt confidențiale.',
        },
      ],
    },
    {
      slug: 'what-is-a-kpi',
      title: 'What is a KPI and how do you use it on a resume?',
      description: 'KPI stands for Key Performance Indicator. Examples by field and how to use them in resume bullet points.',
      answer:
        'A KPI (Key Performance Indicator) is a measurable indicator that shows how well an activity is going: monthly sales, response time, conversion rate, customer satisfaction. On a resume, a KPI turns a vague bullet into proof: you say what you influenced and by how much.',
      sections: [
        {
          heading: 'Which KPIs appear on resumes?',
          paragraphs: [
            'They depend on the field: sales (target attainment, sales value), support (CSAT, first response time), marketing (cost per lead, conversion rate), production (scrap, cycle time), HR (time-to-hire).',
          ],
        },
        {
          heading: 'How do I write one in a bullet?',
          paragraphs: [
            'The pattern: verb + what you did + the KPI before and after. Illustrative example: "Cut average first response time from 45 to 12 minutes by reorganizing the ticket queue."',
          ],
        },
      ],
      faq: [
        {
          question: 'What if I do not know the exact figures?',
          answer: 'Use an honest estimate with a range ("about 40 clients a day") and avoid invented figures.',
        },
        {
          question: 'Can I use confidential KPIs?',
          answer: 'Use percentages and orders of magnitude instead of exact sums if the company figures are confidential.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'ce-este-onboarding-ul',
      title: 'Ce este onboarding-ul?',
      description: 'Onboarding-ul este procesul de integrare a unui angajat nou. Ce include și cum te pregătești în primele zile.',
      answer:
        'Onboarding-ul este procesul prin care un angajat nou este integrat în companie: acces la unelte, cunoașterea echipei, instruire pe procese și obiective pentru primele luni. Un onboarding bun reduce timpul până la primele rezultate.',
      sections: [
        {
          heading: 'Ce include de obicei?',
          paragraphs: [
            'Documente și contract, acces la sisteme, prezentarea echipei, instruiri, un mentor sau un coleg de referință și obiective pentru primele 30, 60 și 90 de zile.',
          ],
        },
        {
          heading: 'Cum mă pregătesc?',
          paragraphs: [
            'Pregătește întrebări despre așteptări și proceduri, notează ce înveți în primele zile și cere feedback devreme. Menționează la interviu că te interesează planul de integrare.',
          ],
        },
      ],
      faq: [
        {
          question: 'Cât durează onboarding-ul?',
          answer: 'Depinde de companie și de rol, de obicei de la câteva zile la câteva luni.',
        },
        {
          question: 'Apare onboarding-ul în CV?',
          answer: 'Doar când ai conceput sau condus procesul pentru alții, de exemplu „Am creat programul de onboarding pentru 25 de angajați noi”.',
        },
      ],
    },
    {
      slug: 'what-is-onboarding',
      title: 'What is onboarding?',
      description: 'Onboarding is the process of integrating a new employee. What it includes and how to prepare for the first days.',
      answer:
        'Onboarding is the process of integrating a new employee into a company: access to tools, meeting the team, training on processes and goals for the first months. Good onboarding shortens the time to first results.',
      sections: [
        {
          heading: 'What does it usually include?',
          paragraphs: [
            'Paperwork and contract, access to systems, team introductions, training, a mentor or buddy and goals for the first 30, 60 and 90 days.',
          ],
        },
        {
          heading: 'How do I prepare?',
          paragraphs: [
            'Prepare questions about expectations and procedures, note what you learn in the first days and ask for feedback early. Mention in the interview that you are interested in the integration plan.',
          ],
        },
      ],
      faq: [
        {
          question: 'How long does onboarding last?',
          answer: 'It depends on the company and role, usually from a few days to a few months.',
        },
        {
          question: 'Does onboarding belong on a resume?',
          answer: 'Only when you designed or ran the process for others, for example "Built the onboarding program for 25 new hires".',
        },
      ],
    },
  ),
  term(
    {
      slug: 'preavizul-la-demisie',
      title: 'Ce este preavizul la demisie?',
      description: 'Preavizul este perioada dintre anunțarea demisiei și încetarea contractului. Cum funcționează și cum îl menționezi în procesul de angajare.',
      answer:
        'Preavizul este perioada dintre momentul în care anunți demisia și ultima zi de lucru. Durata este stabilită prin contractul de muncă sau contractul colectiv, în limitele Codului muncii, și poate fi diferită pentru funcțiile de execuție și cele de conducere. Verifică mereu legislația în vigoare și contractul tău.',
      sections: [
        {
          heading: 'Cum îl menționez la un interviu?',
          paragraphs: [
            'Spune onest durata preavizului din contract și, dacă e posibil, dacă există o înțelegere pentru plecare mai devreme. Noul angajator va planifica începerea în funcție de ea.',
          ],
        },
        {
          heading: 'Ce pot negocia?',
          paragraphs: [
            'Uneori angajatorul acceptă scurtarea preavizului prin acord. Cere acordul în scris și nu începe la noul job înainte de a fi clarificat.',
          ],
        },
      ],
      faq: [
        {
          question: 'Trebuie să scriu preavizul în CV?',
          answer: 'Nu. Îl discuți la interviu sau în oferta de angajare, iar CV-ul rămâne fără el.',
        },
        {
          question: 'Se poate renunța la preaviz?',
          answer: 'Doar prin acordul părților. Verifică contractul și cere confirmarea în scris.',
        },
      ],
    },
    {
      slug: 'what-is-a-notice-period',
      title: 'What is a notice period?',
      description: 'A notice period is the time between announcing your resignation and the end of your contract. How it works and how to mention it when hiring.',
      answer:
        'A notice period is the time between announcing your resignation and your last working day. Its length is set by your employment contract or collective agreement within the limits of the law, and it can differ for staff and management roles. Always check the law in force and your own contract.',
      sections: [
        {
          heading: 'How do I mention it in an interview?',
          paragraphs: [
            'State the contract notice honestly and, where possible, whether an earlier departure can be agreed. The new employer will plan your start around it.',
          ],
        },
        {
          heading: 'What can I negotiate?',
          paragraphs: [
            'Sometimes the employer agrees to shorten the notice by mutual consent. Get the agreement in writing and do not start the new job before it is settled.',
          ],
        },
      ],
      faq: [
        {
          question: 'Does the notice period go on the resume?',
          answer: 'No. You discuss it in the interview or in the job offer, and the resume stays free of it.',
        },
        {
          question: 'Can the notice period be waived?',
          answer: 'Only by agreement of the parties. Check your contract and get confirmation in writing.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'ce-este-un-headhunter',
      title: 'Ce este un headhunter?',
      description: 'Un headhunter este un recrutator care caută activ candidați pentru poziții specializate. Cum lucrează și cum îl abordezi.',
      answer:
        'Un headhunter este un recrutator, intern sau dintr-o agenție, care caută activ candidați pentru poziții specializate sau de conducere, inclusiv persoane care nu aplică la anunțuri. Te poate contacta pe LinkedIn sau pe e-mail pe baza profilului tău, deci un profil actualizat cu cuvinte cheie ale domeniului te face găsit.',
      sections: [
        {
          heading: 'Cum mă găsește un headhunter?',
          paragraphs: [
            'Prin căutări pe LinkedIn după titlu, competențe și locație, prin recomandări și prin baze de CV-uri. Un titlu de profil clar și realizări vizibile cresc șansele.',
          ],
        },
        {
          heading: 'Cum răspund?',
          paragraphs: [
            'Răspunde politicos chiar dacă nu ești interesat acum și întreabă detalii: rol, companie, interval de salariu. Relația cu un headhunter se poate dovedi utilă mai târziu.',
          ],
        },
      ],
      faq: [
        {
          question: 'Plătește candidatul un headhunter?',
          answer: 'În mod normal nu. De obicei firma care angajează plătește serviciul de recrutare.',
        },
        {
          question: 'Pot să îl contactez eu?',
          answer: 'Da. Trimite un mesaj scurt cu rolul căutat, experiența și CV-ul actualizat.',
        },
      ],
    },
    {
      slug: 'what-is-a-headhunter',
      title: 'What is a headhunter?',
      description: 'A headhunter is a recruiter who actively seeks candidates for specialized roles. How they work and how to approach one.',
      answer:
        'A headhunter is a recruiter, in-house or at an agency, who actively seeks candidates for specialized or senior roles, including people who are not applying to postings. They may contact you on LinkedIn or by email based on your profile, so an up-to-date profile with your field keywords makes you findable.',
      sections: [
        {
          heading: 'How does a headhunter find me?',
          paragraphs: [
            'Through LinkedIn searches by title, skills and location, through referrals and through resume databases. A clear profile headline and visible achievements raise your chances.',
          ],
        },
        {
          heading: 'How do I respond?',
          paragraphs: [
            'Reply politely even if you are not interested right now and ask for details: role, company, salary range. A relationship with a headhunter can prove useful later.',
          ],
        },
      ],
      faq: [
        {
          question: 'Does the candidate pay a headhunter?',
          answer: 'Normally no. The hiring company usually pays for the recruitment service.',
        },
        {
          question: 'Can I contact one myself?',
          answer: 'Yes. Send a short message with the role you want, your experience and an updated resume.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'perioada-de-proba',
      title: 'Ce este perioada de probă?',
      description: 'Perioada de probă este intervalul inițial al contractului în care angajatorul verifică aptitudinile angajatului. Ce trebuie să știi.',
      answer:
        'Perioada de probă este intervalul de la începutul contractului de muncă în care angajatorul verifică dacă te potrivești cu postul, iar tu verifici dacă îți convine. Durata maximă este stabilită de Codul muncii și diferă între funcții de execuție și de conducere. Verifică legislația în vigoare și contractul tău.',
      sections: [
        {
          heading: 'Ce se întâmplă în perioada de probă?',
          paragraphs: [
            'Ești evaluat pe sarcinile postului. Contractul poate înceta în condiții mai simple decât în mod obișnuit, deci clarifică de la început criteriile de evaluare.',
          ],
        },
        {
          heading: 'Cum mă pregătesc?',
          paragraphs: [
            'Cere obiective clare pentru primele luni, notează ce livrezi și cere feedback regulat, ca să nu fii surprins la final.',
          ],
        },
      ],
      faq: [
        {
          question: 'Apare perioada de probă în CV?',
          answer: 'Nu. Este o clauză a contractului și intră în intrarea postului respectiv, fără o mențiune separată.',
        },
        {
          question: 'Pot refuza perioada de probă?',
          answer: 'Este o clauză care se stabilește în contract și poate fi negociată înainte de semnare.',
        },
      ],
    },
    {
      slug: 'what-is-a-probation-period',
      title: 'What is a probation period?',
      description: 'A probation period is the initial interval of a contract in which the employer assesses the employee. What to know.',
      answer:
        'A probation period is the opening interval of an employment contract in which the employer checks whether you fit the role, and you check whether the job suits you. The maximum length is set by employment law and can differ between staff and management roles. Check the law in force and your own contract.',
      sections: [
        {
          heading: 'What happens during probation?',
          paragraphs: [
            'You are assessed on the tasks of the role. The contract may end under simpler conditions than usual, so clarify the evaluation criteria from the start.',
          ],
        },
        {
          heading: 'How do I prepare?',
          paragraphs: [
            'Ask for clear goals for the first months, note what you deliver and ask for regular feedback so nothing surprises you at the end.',
          ],
        },
      ],
      faq: [
        {
          question: 'Does probation go on the resume?',
          answer: 'No. It is a clause of the contract and belongs inside that job\'s entry, with no separate mention.',
        },
        {
          question: 'Can I refuse a probation period?',
          answer: 'It is a clause set in the contract and can be negotiated before signing.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'upskilling-si-reskilling',
      title: 'Upskilling și reskilling: ce înseamnă',
      description: 'Diferența dintre upskilling și reskilling, exemple și cum le arăți în CV prin cursuri, certificări și proiecte.',
      answer:
        'Upskilling înseamnă să îți dezvolți competențele în domeniul în care lucrezi deja, iar reskilling înseamnă să înveți competențe noi pentru un alt rol sau domeniu. În CV le arăți prin cursuri finalizate, certificări și proiecte care aplică ce ai învățat.',
      sections: [
        {
          heading: 'Cum le arăt în CV?',
          paragraphs: [
            'Într-o secțiune de formare: numele cursului, platforma sau instituția, anul și, dacă se poate, un proiect rezultat. Alege doar ce este relevant pentru postul vizat.',
          ],
        },
        {
          heading: 'Când contează mai mult reskilling-ul?',
          paragraphs: [
            'La schimbări de carieră. Împreună cu un portofoliu mic, arată recrutorului că ai început deja tranziția.',
          ],
        },
      ],
      faq: [
        {
          question: 'Sunt utile cursurile online?',
          answer: 'Da, mai ales când sunt finalizate și aplicate într-un proiect pe care îl poți arăta.',
        },
        {
          question: 'Câte cursuri trec în CV?',
          answer: 'Doar pe cele relevante pentru post, de obicei 3-5, cu cele mai recente primele.',
        },
      ],
    },
    {
      slug: 'upskilling-and-reskilling',
      title: 'Upskilling and reskilling: what they mean',
      description: 'The difference between upskilling and reskilling, examples and how to show them on a resume through courses, certifications and projects.',
      answer:
        'Upskilling means developing your skills in the field you already work in, while reskilling means learning new skills for a different role or field. On a resume you show them through completed courses, certifications and projects that apply what you learned.',
      sections: [
        {
          heading: 'How do I show them on a resume?',
          paragraphs: [
            'In a training section: the course name, the platform or institution, the year and, if possible, a resulting project. Include only what is relevant to the target role.',
          ],
        },
        {
          heading: 'When does reskilling matter more?',
          paragraphs: [
            'In career changes. Together with a small portfolio, it shows the recruiter that you have already started the transition.',
          ],
        },
      ],
      faq: [
        {
          question: 'Are online courses useful?',
          answer: 'Yes, especially when they are completed and applied in a project you can show.',
        },
        {
          question: 'How many courses should I list?',
          answer: 'Only the relevant ones, usually 3 to 5, with the most recent first.',
        },
      ],
    },
  ),
]
