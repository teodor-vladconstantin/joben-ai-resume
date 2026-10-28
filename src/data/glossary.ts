// Glossary: one short definition page per hiring term, ro + en. Same model as guides.
// Copy rules: no em dashes, no "X, not Y" phrasing, no invented statistics.
import type { Guide, GuideContent } from './guides'
import { GLOSSARY_MORE } from './glossary-more'
import { GLOSSARY_MORE_B } from './glossary-more-b'
import { GLOSSARY_MORE_C } from './glossary-more-c'

const DATE = '2026-10-16'

const term = (ro: GuideContent, en: GuideContent): Guide => ({
  kind: 'glossary',
  datePublished: DATE,
  dateModified: DATE,
  content: { ro, en },
})

const BASE_GLOSSARY: Guide[] = [
  term(
    {
      slug: 'ce-este-ats',
      title: 'Ce este un ATS (Applicant Tracking System)?',
      description: 'ATS înseamnă Applicant Tracking System: software care primește, organizează și filtrează candidaturile. Cum funcționează și ce înseamnă pentru CV.',
      answer:
        'ATS (Applicant Tracking System) este software folosit de companii pentru a primi, organiza și filtra candidaturile. Citește CV-ul, extrage textul în câmpuri (funcții, companii, perioade, competențe) și le oferă recrutorului pentru căutare și filtrare.',
      sections: [
        {
          heading: 'Cum funcționează un ATS?',
          paragraphs: [
            'Sistemul extrage textul din fișier, îl împarte în câmpuri și îl salvează în profilul candidatului. Recrutorul caută apoi după cuvinte cheie, funcții sau ani de experiență.',
            'Un CV cu text real, pe o singură coloană și cu titluri standard este citit corect. Coloanele, tabelele și imaginile pot amesteca sau pierde informații.',
          ],
        },
        {
          heading: 'Ce înseamnă asta pentru CV-ul meu?',
          paragraphs: [
            'Folosește un format simplu și reia în CV formularea din anunț. Poți verifica gratuit cum îl citește un ATS cu scanarea Joben, care dă un scor de la 0 la 100 și punctele de reparat.',
          ],
        },
      ],
      faq: [
        {
          question: 'Respinge ATS-ul automat CV-uri?',
          answer: 'Depinde de configurarea companiei. Unele folosesc întrebări eliminatorii sau filtre pe cuvinte cheie, altele doar organizează candidaturile.',
        },
        {
          question: 'Toate companiile folosesc ATS?',
          answer: 'Mai ales companiile mijlocii și mari. Firmele mici pot primi candidaturile direct pe e-mail.',
        },
      ],
    },
    {
      slug: 'what-is-ats',
      title: 'What is an ATS (Applicant Tracking System)?',
      description: 'ATS stands for Applicant Tracking System: software that receives, organizes and filters job applications. How it works and what it means for your resume.',
      answer:
        'An ATS (Applicant Tracking System) is software companies use to receive, organize and filter job applications. It reads the resume, extracts the text into fields (titles, employers, dates, skills) and gives the recruiter a way to search and filter.',
      sections: [
        {
          heading: 'How does an ATS work?',
          paragraphs: [
            'The system extracts the text from the file, splits it into fields and stores it in the candidate profile. The recruiter then searches by keywords, titles or years of experience.',
            'A resume with real text, a single column and standard headings is read correctly. Columns, tables and images can scramble or lose information.',
          ],
        },
        {
          heading: 'What does this mean for my resume?',
          paragraphs: [
            'Use a simple format and reuse the posting\'s wording. You can check for free how an ATS reads your resume with the Joben scan, which gives a 0 to 100 score and the points to fix.',
          ],
        },
      ],
      faq: [
        {
          question: 'Does an ATS automatically reject resumes?',
          answer: 'It depends on how the company configured it. Some use knockout questions or keyword filters, others only organize applications.',
        },
        {
          question: 'Do all companies use an ATS?',
          answer: 'Mostly mid-size and large companies. Small firms may receive applications directly by email.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'scor-ats',
      title: 'Ce este scorul ATS al unui CV?',
      description: 'Scorul ATS estimează cât de bine poate fi citit și potrivit un CV de un sistem ATS. Ce măsoară, ce nu măsoară și cum îl folosești.',
      answer:
        'Scorul ATS este o estimare, de obicei de la 0 la 100, a cât de ușor poate fi citit un CV de un sistem ATS și cât de bine se potrivește cu un anunț. Nu este un scor oficial al vreunui ATS. Îl folosești ca indicator al problemelor de format și de conținut.',
      sections: [
        {
          heading: 'Ce măsoară un scor ATS?',
          paragraphs: [
            'De obicei verifică structura (titluri standard, ordinea secțiunilor), prezența datelor de contact, lizibilitatea textului extras și, când ai un anunț, acoperirea cuvintelor cheie.',
          ],
        },
        {
          heading: 'Cum îl folosesc corect?',
          paragraphs: [
            'Tratează scorul ca pe o listă de probleme de reparat. Un scor mare indică un fișier bine citit, dar nu garantează un interviu. Joben oferă un scor gratuit, fără cont, pe pagina de verificare ATS.',
          ],
        },
      ],
      faq: [
        {
          question: 'Ce scor este bun?',
          answer: 'Nu există un prag universal. Ține-te de lista de probleme: un CV fără probleme de citire și cu cuvintele cheie din anunț este pregătit.',
        },
        {
          question: 'Scorul diferă între instrumente?',
          answer: 'Da, fiecare instrument folosește criterii proprii, deci scorurile nu se compară direct.',
        },
      ],
    },
    {
      slug: 'ats-score',
      title: 'What is an ATS score for a resume?',
      description: 'An ATS score estimates how well an ATS can read and match a resume. What it measures, what it does not and how to use it.',
      answer:
        'An ATS score is an estimate, usually from 0 to 100, of how easily an ATS can read a resume and how well it matches a posting. It is not an official score from any ATS. Use it as an indicator of formatting and content issues.',
      sections: [
        {
          heading: 'What does an ATS score measure?',
          paragraphs: [
            'It typically checks structure (standard headings, section order), the presence of contact details, the readability of the extracted text and, when you have a posting, keyword coverage.',
          ],
        },
        {
          heading: 'How do I use it properly?',
          paragraphs: [
            'Treat the score as a list of problems to fix. A high score indicates a well-read file but does not guarantee an interview. Joben offers a free score, with no account, on its ATS checker page.',
          ],
        },
      ],
      faq: [
        {
          question: 'What score is good?',
          answer: 'There is no universal threshold. Work through the list of problems: a resume with no reading issues and the posting\'s keywords is ready.',
        },
        {
          question: 'Do scores differ between tools?',
          answer: 'Yes, each tool uses its own criteria, so scores cannot be compared directly.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'parsarea-cv-ului',
      title: 'Ce este parsarea CV-ului (resume parsing)?',
      description: 'Parsarea CV-ului este extragerea automată a informațiilor dintr-un CV în câmpuri structurate. Cum funcționează și ce o strică.',
      answer:
        'Parsarea CV-ului (resume parsing) este procesul prin care un program extrage din fișier textul și îl împarte în câmpuri structurate: nume, contact, experiență, studii, competențe. Calitatea parsării depinde de formatul fișierului și de structura CV-ului.',
      sections: [
        {
          heading: 'Ce strică parsarea?',
          paragraphs: [
            'Coloanele multiple, tabelele, casetele de text, antetele cu date de contact și PDF-urile făcute din imagini. În toate aceste cazuri, ordinea textului din fișier diferă de ordinea vizuală.',
          ],
        },
        {
          heading: 'Cum verific parsarea?',
          paragraphs: [
            'Copiază textul din PDF într-un editor simplu și verifică ordinea. Pentru o verificare automată, folosește scanarea gratuită Joben.',
          ],
        },
      ],
      faq: [
        {
          question: 'Parsarea folosește inteligență artificială?',
          answer: 'Unele sisteme folosesc modele de limbaj, altele reguli. Rezultatul depinde tot de cât de curat este fișierul.',
        },
        {
          question: 'Se parsează și DOCX?',
          answer: 'Da. Majoritatea sistemelor acceptă PDF cu text și DOCX.',
        },
      ],
    },
    {
      slug: 'resume-parsing',
      title: 'What is resume parsing?',
      description: 'Resume parsing is the automatic extraction of information from a resume into structured fields. How it works and what breaks it.',
      answer:
        'Resume parsing is the process by which a program extracts text from a file and splits it into structured fields: name, contact, experience, education, skills. Parsing quality depends on the file format and the structure of the resume.',
      sections: [
        {
          heading: 'What breaks parsing?',
          paragraphs: [
            'Multiple columns, tables, text boxes, headers holding contact details and PDFs made from images. In all of these the order of the text in the file differs from the visual order.',
          ],
        },
        {
          heading: 'How do I check parsing?',
          paragraphs: [
            'Paste the text from the PDF into a plain editor and check the order. For an automatic check, use the free Joben scan.',
          ],
        },
      ],
      faq: [
        {
          question: 'Does parsing use AI?',
          answer: 'Some systems use language models, others use rules. The result still depends on how clean the file is.',
        },
        {
          question: 'Are DOCX files parsed too?',
          answer: 'Yes. Most systems accept text PDFs and DOCX.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'cuvinte-cheie-in-cv',
      title: 'Ce sunt cuvintele cheie din CV?',
      description: 'Cuvintele cheie din CV sunt competențele, uneltele și termenii din anunț după care caută recrutorul. Cum le alegi și le folosești.',
      answer:
        'Cuvintele cheie din CV sunt competențele, uneltele, certificările și titlurile din anunț după care caută recrutorul sau ATS-ul. Le alegi din cerințele obligatorii ale anunțului și le pui în punctele de la experiență, lângă ce ai făcut cu ele.',
      sections: [
        {
          heading: 'Cum le aleg?',
          paragraphs: [
            'Marchează ce apare la cerințele obligatorii sau de mai multe ori în anunț. Folosește formularea exactă și, la termenii cu formă scurtă și lungă, pe amândouă.',
          ],
        },
        {
          heading: 'Ce este keyword stuffing?',
          paragraphs: [
            'Umplerea CV-ului cu termeni fără context. Recrutorul o recunoaște ușor și la interviu ți se cer exemple. Un cuvânt cheie are valoare doar atașat unei realizări.',
          ],
        },
      ],
      faq: [
        {
          question: 'Pot ascunde cuvinte cheie cu text alb?',
          answer: 'Nu merită. Sistemele moderne și recrutorii detectează trucul, iar riscul este respingerea candidaturii.',
        },
        {
          question: 'Câte cuvinte cheie ajung?',
          answer: 'Cele din cerințele obligatorii, în contextul experienței tale. Numărul depinde de anunț.',
        },
      ],
    },
    {
      slug: 'resume-keywords',
      title: 'What are resume keywords?',
      description: 'Resume keywords are the skills, tools and terms from a job posting that recruiters search for. How to choose and use them.',
      answer:
        'Resume keywords are the skills, tools, certifications and titles from a posting that a recruiter or ATS searches for. Choose them from the posting\'s must-haves and place them in your experience bullets, next to what you did with them.',
      sections: [
        {
          heading: 'How do I choose them?',
          paragraphs: [
            'Mark what appears under the must-haves or more than once in the posting. Use the exact wording and, for terms with a short and a long form, include both.',
          ],
        },
        {
          heading: 'What is keyword stuffing?',
          paragraphs: [
            'Filling a resume with terms that have no context. Recruiters spot it easily and interviews ask for examples. A keyword only has value attached to an achievement.',
          ],
        },
      ],
      faq: [
        {
          question: 'Can I hide keywords in white text?',
          answer: 'It is not worth it. Modern systems and recruiters detect the trick, and the risk is a rejected application.',
        },
        {
          question: 'How many keywords are enough?',
          answer: 'Those in the must-haves, placed in the context of your experience. The number depends on the posting.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'cv-cronologic',
      title: 'Ce este un CV cronologic?',
      description: 'CV-ul cronologic ordonează experiența de la cea mai recentă la cea mai veche. Când îl alegi și de ce este preferat de recrutori și ATS.',
      answer:
        'CV-ul cronologic listează experiența de muncă în ordine inversă, de la postul cel mai recent la cel mai vechi. Este formatul cel mai folosit și cel mai ușor de citit pentru recrutori și pentru ATS, pentru că perioadele și funcțiile au o ordine clară.',
      sections: [
        {
          heading: 'Când îl aleg?',
          paragraphs: [
            'Când ai o evoluție continuă în același domeniu sau când vrei să arăți progresia în cariera ta. Este alegerea implicită pentru majoritatea anunțurilor.',
          ],
        },
        {
          heading: 'Când nu se potrivește?',
          paragraphs: [
            'La schimbări de carieră sau pauze lungi poți pune în față un rezumat bazat pe competențe, păstrând experiența în ordine cronologică dedesubt.',
          ],
        },
      ],
      faq: [
        {
          question: 'Cronologic sau funcțional?',
          answer: 'Pentru majoritatea candidaturilor, cronologic. Recrutorii se așteaptă la el, iar ATS-urile îl mapează fără probleme.',
        },
        {
          question: 'Cum tratez o pauză în CV?',
          answer: 'Explică pe scurt pauza (studii, îngrijire, proiecte) pe un rând, onest și fără detalii inutile.',
        },
      ],
    },
    {
      slug: 'chronological-resume',
      title: 'What is a chronological resume?',
      description: 'A chronological resume lists experience from most recent to oldest. When to choose it and why recruiters and ATS prefer it.',
      answer:
        'A chronological resume lists work experience in reverse order, from the most recent role to the oldest. It is the most common format and the easiest for recruiters and ATS software to read, since dates and titles follow a clear order.',
      sections: [
        {
          heading: 'When do I choose it?',
          paragraphs: [
            'When you have continuous progression in one field or want to show career growth. It is the default for most postings.',
          ],
        },
        {
          heading: 'When does it not fit?',
          paragraphs: [
            'For career changes or long gaps, you can lead with a skills-based summary and keep the experience in chronological order below it.',
          ],
        },
      ],
      faq: [
        {
          question: 'Chronological or functional?',
          answer: 'For most applications, chronological. Recruiters expect it and ATS software maps it without trouble.',
        },
        {
          question: 'How do I handle a gap?',
          answer: 'Explain the gap in one honest line (studies, caregiving, projects) without unnecessary detail.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'cv-functional',
      title: 'CV funcțional: definiție, avantaje și riscuri la ATS',
      description: 'Definiția CV-ului funcțional: un CV grupat pe competențe, cu perioadele într-o secțiune scurtă. Când ajută, ce nu le place recrutorilor și cum îl citește un ATS.',
      answer:
        'CV-ul funcțional grupează informațiile pe competențe, iar perioadele de muncă apar într-o secțiune scurtă. Este util la schimbări de carieră, dar mulți recrutori îl găsesc greu de verificat, iar un ATS poate mapa greșit perioadele. Un CV cronologic cu un rezumat bazat pe competențe este de obicei mai sigur.',
      sections: [
        {
          heading: 'Ce avantaje are?',
          paragraphs: [
            'Pune în față competențele transferabile și poate micșora vizibilitatea pauzelor. Poate ajuta când experiența ta nu are legătură directă cu postul.',
          ],
        },
        {
          heading: 'Ce riscuri are?',
          paragraphs: [
            'Recrutorii vor să vadă unde și când ai folosit competențele. Fără perioade clare, CV-ul pare incomplet, iar ATS-ul nu poate lega competențele de angajatori.',
          ],
        },
      ],
      faq: [
        {
          question: 'Care este varianta mai sigură?',
          answer: 'CV-ul cronologic cu un rezumat de competențe în partea de sus, deoarece combină claritatea perioadelor cu accentul pe competențe.',
        },
        {
          question: 'Mai este folosit CV-ul funcțional?',
          answer: 'Rar. Îl întâlnești mai ales la schimbări de domeniu, cu rezultate variabile.',
        },
      ],
    },
    {
      slug: 'functional-resume',
      title: 'Functional resume: definition, pros, cons and ATS risk',
      description: 'Functional resume definition: a resume grouped by skills, with dates in a short section. When it helps, what recruiters dislike and how an ATS reads it.',
      answer:
        'A functional resume groups information by skill, with employment dates in a short section. It helps with career changes, but many recruiters find it hard to verify and an ATS may map dates wrongly. A chronological resume with a skills-based summary is usually safer.',
      sections: [
        {
          heading: 'What are its advantages?',
          paragraphs: [
            'It puts transferable skills up front and can reduce the visibility of gaps. It can help when your experience is not directly related to the role.',
          ],
        },
        {
          heading: 'What are its risks?',
          paragraphs: [
            'Recruiters want to see where and when you used your skills. Without clear dates the resume looks incomplete, and an ATS cannot tie skills to employers.',
          ],
        },
      ],
      faq: [
        {
          question: 'What is the safer option?',
          answer: 'A chronological resume with a skills summary at the top, since it combines clear dates with a skills emphasis.',
        },
        {
          question: 'Is the functional resume still used?',
          answer: 'Rarely. You mostly see it in field changes, with mixed results.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'rezumat-profesional',
      title: 'Ce este rezumatul profesional din CV?',
      description: 'Rezumatul profesional este paragraful scurt din vârful CV-ului. Cum îl scrii în 2-3 propoziții, cu exemple.',
      answer:
        'Rezumatul profesional este paragraful de două-trei propoziții din vârful CV-ului, care spune cine ești profesional, ce competențe aduci și ce post urmărești. Îl rescrii pentru fiecare anunț, cu titlul postului și cu două competențe cheie din cerințe.',
      sections: [
        {
          heading: 'Cum arată un rezumat bun?',
          paragraphs: [
            'Exemplu ilustrativ: „Contabil cu 6 ani de experiență în firme de producție, cu cunoștințe solide de închidere lunară și declarații fiscale. Caut un post de contabil-șef într-o companie în creștere.”',
          ],
        },
        {
          heading: 'Ce evit?',
          paragraphs: [
            'Calitățile generale fără dovezi („dinamic, motivat”) și obiectivele vagi. Fiecare propoziție trebuie să aducă o informație pe care recrutorul o poate folosi.',
          ],
        },
      ],
      faq: [
        {
          question: 'Rezumat sau obiectiv profesional?',
          answer: 'Rezumatul, pentru că arată ce aduci. Obiectivul vorbește despre ce cauți și apare rar la candidații cu experiență.',
        },
        {
          question: 'Cât de lung este?',
          answer: 'Două-trei propoziții, adică 40-60 de cuvinte.',
        },
      ],
    },
    {
      slug: 'resume-summary',
      title: 'What is a resume summary?',
      description: 'A resume summary is the short paragraph at the top of a resume. How to write it in 2-3 sentences, with examples.',
      answer:
        'A resume summary is the two or three sentence paragraph at the top of the resume that says who you are professionally, which skills you bring and which role you want. Rewrite it for each posting, using the job title and two key skills from the requirements.',
      sections: [
        {
          heading: 'What does a good summary look like?',
          paragraphs: [
            'Illustrative example: "Accountant with 6 years of experience in manufacturing firms, strong in month-end close and tax filings. Seeking a chief accountant role at a growing company."',
          ],
        },
        {
          heading: 'What should I avoid?',
          paragraphs: [
            'Generic qualities without proof ("dynamic, motivated") and vague objectives. Every sentence should carry information the recruiter can use.',
          ],
        },
      ],
      faq: [
        {
          question: 'Summary or objective?',
          answer: 'A summary, since it shows what you bring. An objective talks about what you want and is rare for experienced candidates.',
        },
        {
          question: 'How long is it?',
          answer: 'Two or three sentences, about 40-60 words.',
        },
      ],
    },
  ),
  term(
    {
      slug: 'competente-hard-si-soft',
      title: 'Competențe hard și soft: ce înseamnă și cum le pui în CV',
      description: 'Diferența dintre hard skills și soft skills, exemple și cum le arăți în CV prin rezultate concrete.',
      answer:
        'Hard skills sunt competențe tehnice măsurabile (Excel, Python, contabilitate, limbi străine), iar soft skills sunt competențe interpersonale (comunicare, lucru în echipă, adaptabilitate). Pune hard skills într-o secțiune clară și arată soft skills prin exemple din puncte de experiență.',
      sections: [
        {
          heading: 'Cum arăt hard skills?',
          paragraphs: [
            'Listează-le ca text simplu, separate prin virgulă sau în buline, cu nivelul scris în cuvinte (Excel: avansat, tabele pivot). Reia termenii din anunț.',
          ],
        },
        {
          heading: 'Cum arăt soft skills?',
          paragraphs: [
            'Prin fapte. În loc de „bună comunicare”, scrie „Am prezentat săptămânal rezultatele către o echipă de 12 persoane”. Dovada convinge mai mult decât eticheta.',
          ],
        },
      ],
      faq: [
        {
          question: 'Câte competențe pun?',
          answer: 'Cele relevante pentru post, de obicei 8-12. O listă lungă fără legătură diluează CV-ul.',
        },
        {
          question: 'Barele de nivel sunt utile?',
          answer: 'Nu. Un ATS nu le citește, iar nivelul se scrie mai clar în cuvinte.',
        },
      ],
    },
    {
      slug: 'hard-and-soft-skills',
      title: 'Hard and soft skills: what they mean and how to list them',
      description: 'The difference between hard skills and soft skills, examples and how to show them on a resume through concrete results.',
      answer:
        'Hard skills are measurable technical abilities (Excel, Python, accounting, foreign languages) and soft skills are interpersonal abilities (communication, teamwork, adaptability). List hard skills in a clear section and show soft skills through examples in your experience bullets.',
      sections: [
        {
          heading: 'How do I show hard skills?',
          paragraphs: [
            'List them as plain text, comma-separated or as bullets, with the level written in words (Excel: advanced, pivot tables). Reuse the posting\'s terms.',
          ],
        },
        {
          heading: 'How do I show soft skills?',
          paragraphs: [
            'Through facts. Instead of "good communication", write "Presented results weekly to a team of 12". Evidence convinces more than the label.',
          ],
        },
      ],
      faq: [
        {
          question: 'How many skills should I list?',
          answer: 'Those relevant to the role, usually 8-12. A long unrelated list dilutes the resume.',
        },
        {
          question: 'Are skill-level bars useful?',
          answer: 'No. An ATS cannot read them, and level is clearer written in words.',
        },
      ],
    },
  ),
]

export const GLOSSARY: Guide[] = [...BASE_GLOSSARY, ...GLOSSARY_MORE, ...GLOSSARY_MORE_B, ...GLOSSARY_MORE_C]
