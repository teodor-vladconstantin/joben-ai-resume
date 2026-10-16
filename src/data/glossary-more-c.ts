// Glossary terms 21-26. Same model as glossary.ts. Copy rules: no em dashes, no "X, not Y"
// phrasing, no invented statistics. Legal topics point readers to the law in force.
import type { Guide, GuideContent } from './guides'

const DATE = '2026-10-16'

const term = (ro: GuideContent, en: GuideContent): Guide => ({
  kind: 'glossary',
  datePublished: DATE,
  dateModified: DATE,
  content: { ro, en },
})

export const GLOSSARY_MORE_C: Guide[] = [
  term(
    {
      slug: 'fisa-postului',
      title: 'Ce este fișa postului?',
      description: 'Fișa postului descrie atribuțiile, cerințele și relațiile unui rol. Cum o citești și cum o folosești la CV și la interviu.',
      answer:
        'Fișa postului este documentul care descrie atribuțiile, responsabilitățile, cerințele și relațiile unui rol într-o companie. Anunțul de angajare reia în general părți din ea. O citești atent ca să știi ce se așteaptă de la tine și o folosești pentru a alege cuvintele cheie din CV.',
      sections: [
        {
          heading: 'Ce conține?',
          paragraphs: [
            'Titlul postului, scopul, atribuțiile principale, cerințele de studii și experiență, competențele necesare și relațiile ierarhice și funcționale. Forma exactă diferă de la o companie la alta.',
          ],
        },
        {
          heading: 'Cum o folosesc?',
          paragraphs: [
            'Marchează competențele și uneltele repetate, apoi reia-le în CV, lângă realizările tale. La interviu, cere să înțelegi cum arată o zi tipică și cum se măsoară succesul în rol.',
          ],
        },
      ],
      faq: [
        {
          question: 'Primesc fișa postului înainte de angajare?',
          answer: 'Adesea se discută la interviu și se semnează la angajare. Poți cere un exemplar sau o descriere detaliată înainte de decizie.',
        },
        {
          question: 'Se poate schimba fișa postului?',
          answer: 'Modificările se fac, de regulă, prin act adițional sau procedură internă. Verifică legislația muncii și contractul tău.',
        },
      ],
    },
    {
      slug: 'what-is-a-job-description',
      title: 'What is a job description?',
      description: 'A job description lays out the duties, requirements and relationships of a role. How to read it and use it for your resume and interview.',
      answer:
        'A job description is the document that lays out the duties, responsibilities, requirements and relationships of a role in a company. The job posting usually reuses parts of it. Read it carefully to know what is expected of you and use it to choose the keywords for your resume.',
      sections: [
        {
          heading: 'What does it contain?',
          paragraphs: [
            'The job title, purpose, main duties, education and experience requirements, required skills and reporting and working relationships. The exact form differs from company to company.',
          ],
        },
        {
          heading: 'How do I use it?',
          paragraphs: [
            'Mark the skills and tools that repeat, then reuse them in your resume next to your achievements. In the interview, ask to understand what a typical day looks like and how success is measured in the role.',
          ],
        },
      ],
      faq: [
        {
          question: 'Do I get the job description before being hired?',
          answer: 'It is often discussed in the interview and signed at hiring. You can ask for a copy or a detailed description before deciding.',
        },
        {
          question: 'Can the job description change?',
          answer: 'Changes are usually made through an addendum or an internal procedure. Check employment law and your contract.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'assessment-center',
      title: 'Ce este un assessment center?',
      description: 'Assessment center este o etapă de selecție cu mai multe exerciții: studii de caz, jocuri de rol, teste. Cum te pregătești.',
      answer:
        'Un assessment center este o etapă de selecție în care candidații sunt evaluați prin mai multe exerciții: studii de caz, jocuri de rol, teste, prezentări și lucru în grup, adesea într-o singură zi. Evaluatorii urmăresc comportamentul și competențele, pe lângă conținutul răspunsurilor. Te pregătești exersând exemplele și structura.',
      sections: [
        {
          heading: 'Ce exerciții apar?',
          paragraphs: [
            'Exerciții de grup, studii de caz, prezentări, teste de logică sau de limbă, jocuri de rol și un interviu individual. Combinația depinde de rol și de companie.',
          ],
        },
        {
          heading: 'Cum mă pregătesc?',
          paragraphs: [
            'Citește descrierea etapei, exersează o prezentare de 5 minute și un studiu de caz cu timp limitat, și gândește-te cum colaborezi în grup: asculți, propui, sintetizezi. Evită să domini discuția.',
          ],
        },
      ],
      faq: [
        {
          question: 'Cât durează?',
          answer: 'De obicei o zi sau o jumătate de zi, uneori online.',
        },
        {
          question: 'Cum mă evaluează la exercițiile de grup?',
          answer: 'Se urmăresc colaborarea, comunicarea și contribuția la rezultat.',
        },
      ],
    },
    {
      slug: 'what-is-an-assessment-center',
      title: 'What is an assessment center?',
      description: 'An assessment center is a selection stage with several exercises: case studies, role plays, tests. How to prepare.',
      answer:
        'An assessment center is a selection stage in which candidates are evaluated through several exercises: case studies, role plays, tests, presentations and group work, often in a single day. Assessors watch behavior and skills as well as the answers. You prepare by practicing examples and structure.',
      sections: [
        {
          heading: 'Which exercises appear?',
          paragraphs: [
            'Group exercises, case studies, presentations, logic or language tests, role plays and an individual interview. The mix depends on the role and the company.',
          ],
        },
        {
          heading: 'How do I prepare?',
          paragraphs: [
            'Read the description of the stage, practice a 5-minute presentation and a timed case study, and think about how you collaborate in a group: you listen, propose, summarize. Avoid dominating the discussion.',
          ],
        },
      ],
      faq: [
        {
          question: 'How long does it last?',
          answer: 'Usually a day or half a day, sometimes online.',
        },
        {
          question: 'How am I assessed in group exercises?',
          answer: 'Assessors look at collaboration, communication and contribution to the outcome.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'munca-hibrida',
      title: 'Ce înseamnă munca hibridă?',
      description: 'Munca hibridă combină munca de la birou cu cea de acasă. Ce presupune, ce întrebi la interviu și cum o menționezi în CV.',
      answer:
        'Munca hibridă combină zile lucrate de la birou cu zile lucrate de acasă sau de la distanță, după un program stabilit de companie. Modelul diferă mult: unele firme cer două zile la birou, altele patru. Clarifică la interviu regula exactă, echipamentele și eventualele costuri decontate.',
      sections: [
        {
          heading: 'Ce întreb la interviu?',
          paragraphs: ['Detalii care contează în practică:'],
          items: [
            'Câte zile la birou și dacă sunt fixe sau flexibile.',
            'Echipamentele oferite și eventualele sume decontate.',
            'Cum se măsoară rezultatele și cum comunică echipa.',
            'Dacă regulile se pot schimba în timp.',
          ],
        },
        {
          heading: 'Cum menționez experiența în CV?',
          paragraphs: [
            'Poți scrie „Hibrid” sau „La distanță” lângă locație și arăta unelte de colaborare (Slack, Teams, Notion) și rezultate livrate în echipe distribuite.',
          ],
        },
      ],
      faq: [
        {
          question: 'Este același lucru cu telemunca?',
          answer: 'Nu întotdeauna. Telemunca are un regim juridic specific în legislația muncii; verifică contractul și legislația în vigoare.',
        },
        {
          question: 'Cum arăt că lucrez bine la distanță?',
          answer: 'Prin exemple de proiecte livrate în echipe distribuite, comunicare scrisă clară și autonomie.',
        },
      ],
    },
    {
      slug: 'what-is-hybrid-work',
      title: 'What is hybrid work?',
      description: 'Hybrid work combines office days with remote days. What it involves, what to ask in the interview and how to mention it on a resume.',
      answer:
        'Hybrid work combines days worked from the office with days worked from home or remotely, on a schedule set by the company. The model varies widely: some firms ask for two days in the office, others four. Clarify the exact rule, the equipment and any reimbursed costs in the interview.',
      sections: [
        {
          heading: 'What do I ask in the interview?',
          paragraphs: ['Details that matter in practice:'],
          items: [
            'How many days in the office and whether they are fixed or flexible.',
            'Equipment provided and any reimbursed amounts.',
            'How results are measured and how the team communicates.',
            'Whether the rules can change over time.',
          ],
        },
        {
          heading: 'How do I mention the experience on a resume?',
          paragraphs: [
            'You can write "Hybrid" or "Remote" next to the location and show collaboration tools (Slack, Teams, Notion) and results delivered in distributed teams.',
          ],
        },
      ],
      faq: [
        {
          question: 'Is it the same as remote work under the law?',
          answer: 'Not always. Teleworking has a specific legal regime in employment law; check your contract and the law in force.',
        },
        {
          question: 'How do I show that I work well remotely?',
          answer: 'Through examples of projects delivered in distributed teams, clear written communication and autonomy.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'angajare-pe-baza-competentelor',
      title: 'Ce este angajarea pe bază de competențe?',
      description: 'Angajarea pe bază de competențe evaluează candidații după ce știu să facă în practică. Cum îți construiești CV-ul pentru ea.',
      answer:
        'Angajarea pe bază de competențe (skills-based hiring) evaluează candidații după ce pot face dovedit, prin teste, proiecte și exemple, și acordă mai puțină greutate diplomei sau titlurilor anterioare. Pentru un astfel de proces, CV-ul arată competențele cu dovezi: proiecte, rezultate, portofoliu.',
      sections: [
        {
          heading: 'Cum îmi construiesc CV-ul?',
          paragraphs: [
            'Pune în față competențele cerute, fiecare cu un exemplu: un proiect, un rezultat, un link. Adaugă certificări și lucrări practice. Educația rămâne, dar nu mai este singurul argument.',
          ],
        },
        {
          heading: 'Cum mă pregătesc pentru evaluare?',
          paragraphs: [
            'Anticipează un test practic sau o temă. Exersează sarcinile tipice ale rolului și pregătește un portofoliu mic pe care îl poți discuta.',
          ],
        },
      ],
      faq: [
        {
          question: 'Mai contează diploma?',
          answer: 'În multe domenii da, mai ales în profesii reglementate. Într-o abordare pe competențe, diploma se completează cu dovezi practice.',
        },
        {
          question: 'Cum găsesc firme care o folosesc?',
          answer: 'Anunțurile care cer „portofoliu” sau „temă practică” sunt un semn bun. Citește descrierea procesului de selecție.',
        },
      ],
    },
    {
      slug: 'what-is-skills-based-hiring',
      title: 'What is skills-based hiring?',
      description: 'Skills-based hiring evaluates candidates on what they can do in practice. How to build your resume for it.',
      answer:
        'Skills-based hiring evaluates candidates on what they can demonstrably do, through tests, projects and examples, and puts less weight on a diploma or previous titles. For such a process, the resume shows skills with proof: projects, results, a portfolio.',
      sections: [
        {
          heading: 'How do I build my resume?',
          paragraphs: [
            'Put the required skills up front, each with an example: a project, a result, a link. Add certifications and practical work. Education stays, but it is no longer the only argument.',
          ],
        },
        {
          heading: 'How do I prepare for the assessment?',
          paragraphs: [
            'Expect a practical test or assignment. Practice the typical tasks of the role and prepare a small portfolio you can discuss.',
          ],
        },
      ],
      faq: [
        {
          question: 'Does the diploma still matter?',
          answer: 'In many fields yes, especially regulated professions. In a skills-based approach, the diploma is complemented by practical proof.',
        },
        {
          question: 'How do I find companies that use it?',
          answer: 'Postings that ask for a "portfolio" or a "practical assignment" are a good sign. Read the description of the selection process.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'oferta-de-angajare',
      title: 'Ce conține o ofertă de angajare?',
      description: 'O ofertă de angajare cuprinde salariul, beneficiile, data de început și condițiile. Ce verifici înainte să accepți.',
      answer:
        'O ofertă de angajare cuprinde de obicei funcția, salariul, beneficiile, data de început, programul și condițiile principale. Citește oferta cu atenție și cere clarificări în scris înainte să accepți. Documentul care produce efecte legale este contractul individual de muncă; verifică legislația și contractul.',
      sections: [
        {
          heading: 'Ce verific în ofertă?',
          paragraphs: ['Elemente de urmărit:'],
          items: [
            'Salariul brut sau net și frecvența plății, plus bonusurile.',
            'Beneficiile: tichete, asigurare medicală, zile libere, formare.',
            'Programul, locația și regimul de lucru la distanță.',
            'Perioada de probă și preavizul.',
          ],
        },
        {
          heading: 'Cum răspund?',
          paragraphs: [
            'Mulțumește și cere timp rezonabil de gândire. Dacă negociezi, fă-o politicos, cu argumente și cifre reale, apoi confirmă în scris condițiile finale.',
          ],
        },
      ],
      faq: [
        {
          question: 'Pot refuza oferta?',
          answer: 'Da. Răspunde politicos și rapid, ca firma să își poată continua procesul.',
        },
        {
          question: 'Ce fac dacă oferta diferă de ce s-a discutat?',
          answer: 'Cere clarificări în scris și nu accepta până nu sunt lămurite diferențele.',
        },
      ],
    },
    {
      slug: 'what-is-in-a-job-offer',
      title: 'What does a job offer contain?',
      description: 'A job offer covers salary, benefits, start date and conditions. What to check before you accept.',
      answer:
        'A job offer usually covers the position, salary, benefits, start date, schedule and main conditions. Read the offer carefully and ask for clarifications in writing before accepting. The document that produces legal effects is the individual employment contract; check the law and your contract.',
      sections: [
        {
          heading: 'What do I check in the offer?',
          paragraphs: ['Elements to look at:'],
          items: [
            'Gross or net salary and payment frequency, plus bonuses.',
            'Benefits: meal vouchers, health insurance, time off, training.',
            'Schedule, location and remote work arrangement.',
            'Probation period and notice.',
          ],
        },
        {
          heading: 'How do I respond?',
          paragraphs: [
            'Say thanks and ask for reasonable time to think. If you negotiate, do it politely, with arguments and real figures, then confirm the final terms in writing.',
          ],
        },
      ],
      faq: [
        {
          question: 'Can I decline the offer?',
          answer: 'Yes. Reply politely and quickly so the company can continue its process.',
        },
        {
          question: 'What if the offer differs from what was discussed?',
          answer: 'Ask for clarification in writing and do not accept until the differences are resolved.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'feedback-dupa-interviu',
      title: 'Cum ceri feedback după un interviu',
      description: 'Cum ceri feedback după un interviu respins, cum formulezi mesajul și cum folosești răspunsul pentru următoarele candidaturi.',
      answer:
        'Poți cere feedback după un interviu printr-un mesaj scurt și politicos către recrutor, la 1-2 zile după ce primești răspunsul negativ. Mulțumește pentru timp, spune că vrei să te îmbunătățești și întreabă una-două lucruri concrete. Nu toate firmele răspund, dar răspunsurile primite sunt valoroase.',
      sections: [
        {
          heading: 'Cum formulez mesajul?',
          paragraphs: [
            'Exemplu ilustrativ: „Vă mulțumesc pentru interviu și pentru decizie. Dacă aveți timp, aș aprecia un scurt feedback despre ce aș putea îmbunătăți pentru roluri similare.” Rămâi scurt și politicos.',
          ],
        },
        {
          heading: 'Cum folosesc răspunsul?',
          paragraphs: [
            'Notează temele repetate (de exemplu lipsa unui exemplu tehnic sau claritatea răspunsurilor) și lucrează la ele înainte de următorul interviu. Păstrează legătura pentru posturi viitoare.',
          ],
        },
      ],
      faq: [
        {
          question: 'De ce nu primesc răspuns?',
          answer: 'Multe firme nu dau feedback din motive de timp sau politică internă. O notă politicoasă nu strică relația.',
        },
        {
          question: 'Pot contesta decizia?',
          answer: 'Nu este recomandat. Folosește conversația pentru a înțelege și a te îmbunătăți.',
        },
      ],
    },
    {
      slug: 'how-to-ask-for-interview-feedback',
      title: 'How to ask for feedback after an interview',
      description: 'How to ask for feedback after a rejected interview, how to phrase the message and how to use the answer for later applications.',
      answer:
        'You can ask for feedback after an interview with a short, polite message to the recruiter, one or two days after the negative answer. Thank them for their time, say you want to improve and ask one or two concrete things. Not every company replies, but the replies you get are valuable.',
      sections: [
        {
          heading: 'How do I phrase the message?',
          paragraphs: [
            'Illustrative example: "Thank you for the interview and for the decision. If you have time, I would appreciate brief feedback on what I could improve for similar roles." Stay short and polite.',
          ],
        },
        {
          heading: 'How do I use the answer?',
          paragraphs: [
            'Note recurring themes (for example a missing technical example or the clarity of answers) and work on them before the next interview. Keep in touch for future roles.',
          ],
        },
      ],
      faq: [
        {
          question: 'Why do I get no reply?',
          answer: 'Many companies give no feedback for reasons of time or internal policy. A polite note does no harm to the relationship.',
        },
        {
          question: 'Can I challenge the decision?',
          answer: 'It is not advisable. Use the conversation to understand and improve.',
        },
      ],
    },
  ),
]
