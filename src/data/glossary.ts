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
  {
    ...term(
    {
      slug: 'cuvinte-cheie-in-cv',
      title: 'Cuvinte cheie în CV: liste pe 8 domenii și ATS',
      description:
        'Ce sunt cuvintele cheie din CV, cum le găsești în anunț, liste pe 8 domenii și cum le potrivește un ATS. Verifică gratuit CV-ul tău.',
      answer:
        'Cuvintele cheie din CV sunt competențele, uneltele, certificările și titlurile de post cerute în anunț, aceiași termeni pe care recrutorul îi caută în ATS. Le găsești în secțiunile de cerințe și responsabilități ale anunțului: notează tot ce apare la cerințe obligatorii sau de mai multe ori. Folosește apoi exact aceeași formulare în rezumat, la competențe și în punctele de la experiență, lângă ce ai făcut concret.',
      ctaLocation: 'guide_keywords',
      sections: [
        {
          heading: 'Cum găsești cuvintele cheie în anunțul de job?',
          paragraphs: [
            'Anunțul este lista de cuvinte cheie. Angajatorul a scris deja ce va căuta, așa că treaba ta este să extragi termenii și să verifici pe care îi poți susține cu experiență reală.',
          ],
          items: [
            'Copiază anunțul într-un document și marchează titlul postului, competențele cerute, uneltele, certificările și studiile.',
            'Numără repetările. Un termen care apare în titlu, la cerințe și la responsabilități este un cuvânt cheie principal.',
            'Separă cerințele obligatorii de cele care sunt un avantaj. Cele obligatorii intră primele în CV.',
            'Notează abrevierile în ambele forme, de exemplu Search Engine Optimization (SEO) sau Expert Contabil (CECCAR).',
            'Compară două sau trei anunțuri similare. Termenii care apar în toate sunt cuvintele cheie de bază ale rolului.',
            'Păstrează doar termenii pe care îi poți dovedi. Oricare dintre ei poate apărea la interviu.',
          ],
        },
        {
          heading: 'Ce tipuri de cuvinte cheie există?',
          paragraphs: [
            'Competențele tehnice (hard skills) se învață și se măsoară: modelare financiară, evaluarea pacientului, proiectare CAD. Ele contează cel mai mult în căutarea din ATS, pentru că recrutorii filtrează după ele.',
            'Competențele personale (soft skills), precum negocierea sau atenția la detalii, contează pentru omul care citește CV-ul. Arată-le printr-un rezultat într-un punct de la experiență, pentru că o listă simplă de calități spune puțin.',
            'Uneltele sunt programele, platformele și echipamentele numite în anunț: Salesforce, SAP, AutoCAD, Excel. Adaugă titlurile de post, certificările și diplomele, scrise exact ca în anunț.',
          ],
        },
        {
          heading: 'Cuvinte cheie pentru CV în IT',
          paragraphs: ['Anunțurile din IT numesc limbaje, framework-uri și practici precise. Folosește versiunea și scrierea din anunț.'],
          items: [
            'Hard skills: dezvoltare software, REST API, arhitectură cloud, CI/CD, teste unitare, design de sistem, modelarea datelor, securitate cibernetică, Agile, Scrum.',
            'Soft skills: rezolvarea problemelor, code review, comunicare tehnică, mentorat, colaborare între echipe.',
            'Unelte: Python, Java, JavaScript, TypeScript, React, SQL, AWS, Azure, Docker, Kubernetes, Git, Jira.',
          ],
        },
        {
          heading: 'Cuvinte cheie pentru CV în vânzări',
          paragraphs: ['Anunțurile de vânzări cer cifre. Pune lângă fiecare cuvânt cheie un target, o cifră de afaceri sau un pipeline din experiența ta.'],
          items: [
            'Hard skills: generare de lead-uri, prospectare, cold calling, gestionarea pipeline-ului, key account management, negocierea contractelor, îndeplinirea targetului, vânzări B2B, upselling, prognoza vânzărilor.',
            'Soft skills: construirea relațiilor, persuasiune, ascultare activă, reziliență, gestionarea obiecțiilor.',
            'Unelte: Salesforce, HubSpot CRM, Pipedrive, LinkedIn Sales Navigator, Microsoft Dynamics.',
          ],
        },
        {
          heading: 'Cuvinte cheie pentru CV în marketing',
          paragraphs: ['Rolurile de marketing diferă mult între content, performance și brand. Ia numele canalelor direct din anunț.'],
          items: [
            'Hard skills: SEO, SEM, content marketing, email marketing, social media plătit, marketing automation, testare A/B, optimizarea conversiei, management de campanii, cercetare de piață.',
            'Soft skills: creativitate, copywriting, storytelling, gândire analitică, coordonare de proiecte.',
            'Unelte: Google Analytics 4, Google Ads, Meta Ads Manager, HubSpot, Mailchimp, Semrush, Canva, WordPress.',
          ],
        },
        {
          heading: 'Cuvinte cheie pentru CV în finanțe și contabilitate',
          paragraphs: ['Anunțurile din finanțe cer des standarde și certificări. Scrie-le o dată complet, apoi folosește abrevierea.'],
          items: [
            'Hard skills: analiză financiară, modelare financiară, bugetare, prognoză, furnizori, clienți, reconcilieri, închidere de lună, IFRS, raportare fiscală, audit, declarații ANAF.',
            'Soft skills: atenție la detalii, acuratețe, confidențialitate, respectarea termenelor, comunicare cu departamentele.',
            'Unelte: Microsoft Excel (tabele pivot, XLOOKUP), SAP, Oracle NetSuite, Saga, WinMentor, Power BI.',
          ],
        },
        {
          heading: 'Cuvinte cheie pentru CV în resurse umane',
          paragraphs: ['Anunțurile de HR combină termeni de proces cu legislația muncii. Numește sistemele pe care chiar le-ai folosit.'],
          items: [
            'Hard skills: recrutare, recrutare end-to-end, onboarding, relații cu angajații, managementul performanței, compensații și beneficii, salarizare, REVISAL, Codul muncii, planificarea personalului.',
            'Soft skills: comunicare interpersonală, rezolvarea conflictelor, discreție, empatie, coaching.',
            'Unelte: Workday, BambooHR, SAP SuccessFactors, Charisma HCM, LinkedIn Recruiter.',
          ],
        },
        {
          heading: 'Cuvinte cheie pentru CV în sănătate',
          paragraphs: ['Anunțurile din sănătate filtrează întâi după aviz și competențe clinice. Trece avizul de liberă practică și statutul lui unde le cere anunțul.'],
          items: [
            'Hard skills: îngrijirea pacientului, evaluarea pacientului, administrarea medicației, prevenirea infecțiilor, plan de îngrijire, triaj, monitorizarea funcțiilor vitale, documentație medicală, BLS, ACLS.',
            'Soft skills: compasiune, comunicare cu pacientul, lucru în echipă, calm sub presiune, educația pacientului.',
            'Unelte: fișa electronică a pacientului, sisteme informatice de spital (HIS), injectomate, monitoare de funcții vitale.',
          ],
        },
        {
          heading: 'Cuvinte cheie pentru CV în inginerie',
          paragraphs: ['Anunțurile de inginerie numesc domeniul, standardele și programele. Reia-le pe toate trei.'],
          items: [
            'Hard skills: proiectare mecanică, modelare CAD, analiză cu elemente finite (FEA), analiza cauzei principale, lean manufacturing, Six Sigma, controlul calității, desen tehnic, management de proiect tehnic, ISO 9001.',
            'Soft skills: gândire analitică, precizie, atenție la siguranță, coordonare între echipe, documentare tehnică.',
            'Unelte: AutoCAD, SolidWorks, CATIA, MATLAB, ANSYS, programare PLC.',
          ],
        },
        {
          heading: 'Cuvinte cheie pentru CV administrativ',
          paragraphs: ['Anunțurile administrative cer varietate. Listează sarcinile de birou și programele din anunț pe care le folosești zilnic.'],
          items: [
            'Hard skills: gestionarea agendei, programări, introducere de date, arhivare, organizarea deplasărilor, administrare birou, facturare, minute de ședință, registratură, recepție.',
            'Soft skills: organizare, lucru pe mai multe sarcini, comunicare scrisă, seriozitate, orientare spre client.',
            'Unelte: Microsoft Office 365, Outlook, Excel, Google Workspace, Zoom, Microsoft Teams.',
          ],
        },
        {
          heading: 'Cum citește un ATS cuvintele cheie?',
          paragraphs: [
            'Un ATS extrage întâi textul din CV și îl împarte în câmpuri: funcții, angajatori, perioade, studii, competențe. Recrutorul caută și filtrează apoi în aceste câmpuri cu termenii din anunț. Unele sisteme ordonează și candidații după cât de bine se potrivește CV-ul cu anunțul.',
            'Regulile de potrivire diferă de la un sistem la altul. Multe caută expresia exactă, unele recunosc și pluralul sau forme apropiate, puține înțeleg că două cuvinte diferite înseamnă același lucru. Varianta sigură este să folosești cel puțin o dată formularea exactă din anunț și să scrii abrevierile în ambele forme.',
            'Iată cum se compară câteva rânduri dintr-un anunț cu rânduri dintr-un CV:',
          ],
          table: {
            headers: ['Anunțul cere', 'CV-ul spune', 'Rezultat probabil'],
            rows: [
              ['Minimum 3 ani experiență cu Salesforce', 'Am gestionat 120 de conturi în Salesforce între 2021 și 2025', 'Potrivire: unealta și anii apar amândouă'],
              ['Search engine optimization (SEO)', 'Am crescut traficul organic prin SEO', 'Parțial: scrie o dată „search engine optimization (SEO)” ca să te găsească ambele căutări'],
              ['Managementul relației cu stakeholderii', 'Am lucrat cu multe echipe diferite', 'Fără potrivire: expresia din anunț lipsește'],
              ['Excel (tabele pivot, VLOOKUP)', 'Excel avansat: tabele pivot, XLOOKUP', 'Parțial: Excel și tabele pivot se potrivesc, VLOOKUP lipsește'],
              ['Studii superioare economice', 'Licență ASE, Contabilitate', 'Depinde de sistem: adaugă „Studii superioare economice, Facultatea de Contabilitate (ASE)”'],
            ],
          },
        },
        {
          heading: 'Unde pui cuvintele cheie în CV?',
          paragraphs: ['Distribuie cuvintele cheie în secțiunile pe care le citește recrutorul și le indexează ATS-ul.'],
          items: [
            'Titlul CV-ului: denumirea postului din anunț, dacă descrie ce faci.',
            'Rezumat: titlul postului plus două sau trei competențe obligatorii.',
            'Competențe: hard skills și unelte, grupate și scrise ca în anunț.',
            'Experiență: fiecare competență importantă lângă un rezultat, de exemplu „Am redus închiderea de lună de la 8 la 5 zile în SAP”.',
            'Certificări și studii: denumirea completă, cu abrevierea în paranteză.',
          ],
        },
      ],
      faq: [
        {
          question: 'Ce sunt cuvintele cheie dintr-un CV?',
          answer: 'Sunt competențele, uneltele, certificările și titlurile de post din anunț după care caută recrutorul în ATS. Un CV care folosește aceiași termeni apare în mai multe căutări și pare mai potrivit pentru rol.',
        },
        {
          question: 'Câte cuvinte cheie trebuie să aibă un CV?',
          answer: 'Nu există un număr fix. Acoperă toate cerințele obligatorii pe care le poți susține, plus avantajele pe care chiar le ai. La majoritatea anunțurilor asta înseamnă 10 până la 20 de termeni, fiecare folosit în context.',
        },
        {
          question: 'Cuvintele cheie trebuie să fie identice cu cele din anunț?',
          answer: 'E mai sigur așa. Multe căutări din ATS caută expresia exactă, deci folosește formularea din anunț cel puțin o dată și scrie atât forma completă, cât și abrevierea.',
        },
        {
          question: 'Pot ascunde cuvinte cheie cu text alb?',
          answer: 'Nu merită. Sistemele moderne și recrutorii detectează trucul, iar riscul este respingerea candidaturii.',
        },
        {
          question: 'Schimb cuvintele cheie la fiecare aplicare?',
          answer: 'Da. Păstrează un CV de bază și ajustează rezumatul, competențele și ordinea punctelor pentru fiecare anunț, ca să apară termenii obligatorii. Experiența rămâne aceeași; se schimbă formularea și accentul.',
        },
        {
          question: 'Cum verific ce cuvinte cheie îi lipsesc CV-ului meu?',
          answer: 'Trece CV-ul printr-un verificator ATS gratuit. Vezi cum citește parserul fișierul și ce părți trebuie reparate, înainte să aplici.',
        },
      ],
    },
    {
      slug: 'resume-keywords',
      title: 'Resume Keywords: 8 Industry Lists and Free ATS Check',
      description:
        'What resume keywords are, how to find them in a job posting, lists for 8 industries and how ATS scanners match them. Check your resume free.',
      answer:
        "Resume keywords are the skills, tools, certifications and job titles a job posting asks for, the same terms a recruiter types into the ATS search. To find them, read the posting's requirements and responsibilities and note every term listed as a must-have or repeated more than once. Use that exact wording in your summary, skills section and experience bullets, next to what you did with it.",
      ctaLocation: 'guide_keywords',
      sections: [
        {
          heading: 'How do you find keywords in a job posting?',
          paragraphs: [
            'The posting is the keyword list. The employer wrote down what they will search for, so your job is to pull those terms out and check which ones you can honestly claim.',
          ],
          items: [
            'Copy the posting into a document and highlight the job title, required skills, tools, certifications and degrees.',
            'Count repeats. A term that appears in the title, the requirements and the responsibilities is a top keyword.',
            'Split must-haves from nice-to-haves. Must-haves go into your resume first.',
            'Write down both forms of abbreviations, for example Search Engine Optimization (SEO) or Certified Public Accountant (CPA).',
            'Compare two or three similar postings. Terms that show up in all of them are the core keywords for the role.',
            'Keep only the terms you can back up with real experience. Each one may come up in the interview.',
          ],
        },
        {
          heading: 'What types of resume keywords are there?',
          paragraphs: [
            'Hard skills are teachable, measurable abilities such as financial modeling or patient assessment. They carry the most weight in an ATS search because recruiters filter on them.',
            'Soft skills such as negotiation or attention to detail matter to the person reading the resume. Show them through a result in a bullet point, since a bare list of soft skills says little.',
            'Tools are the software, platforms and equipment named in the posting: Salesforce, SAP, AutoCAD, Epic. Add job titles, certifications and degrees on top, written the way the posting writes them.',
          ],
        },
        {
          heading: 'IT and software resume keywords',
          paragraphs: ['Postings in IT name specific languages, frameworks and practices. Match the version and spelling they use.'],
          items: [
            'Hard skills: software development, REST APIs, cloud architecture, CI/CD, unit testing, system design, data modeling, cybersecurity, Agile, Scrum.',
            'Soft skills: problem solving, code review, technical communication, mentoring, cross-functional collaboration.',
            'Tools: Python, Java, JavaScript, TypeScript, React, SQL, AWS, Azure, Docker, Kubernetes, Git, Jira.',
          ],
        },
        {
          heading: 'Sales resume keywords',
          paragraphs: ['Sales postings ask for numbers. Pair each keyword with a quota, revenue or pipeline figure from your own record.'],
          items: [
            'Hard skills: lead generation, prospecting, cold calling, pipeline management, account management, contract negotiation, quota attainment, B2B sales, upselling, sales forecasting.',
            'Soft skills: relationship building, persuasion, active listening, resilience, objection handling.',
            'Tools: Salesforce, HubSpot CRM, Pipedrive, LinkedIn Sales Navigator, Outreach, Gong.',
          ],
        },
        {
          heading: 'Marketing resume keywords',
          paragraphs: ['Marketing roles vary a lot between content, performance and brand. Take the channel names straight from the posting.'],
          items: [
            'Hard skills: SEO, SEM, content marketing, email marketing, paid social, marketing automation, A/B testing, conversion rate optimization, campaign management, market research.',
            'Soft skills: creativity, copywriting, storytelling, analytical thinking, project coordination.',
            'Tools: Google Analytics 4, Google Ads, Meta Ads Manager, HubSpot, Mailchimp, Semrush, Canva, WordPress.',
          ],
        },
        {
          heading: 'Finance and accounting resume keywords',
          paragraphs: ['Finance postings often list standards and certifications. Write them in full once, then use the abbreviation.'],
          items: [
            'Hard skills: financial analysis, financial modeling, budgeting, forecasting, accounts payable, accounts receivable, reconciliation, month-end close, IFRS, GAAP, audit, tax compliance.',
            'Soft skills: attention to detail, accuracy, confidentiality, deadline management, stakeholder communication.',
            'Tools: Microsoft Excel (pivot tables, XLOOKUP), SAP, Oracle NetSuite, QuickBooks, Power BI.',
          ],
        },
        {
          heading: 'HR resume keywords',
          paragraphs: ['HR postings mix process terms with local employment law. Use the names of the systems you actually ran.'],
          items: [
            'Hard skills: talent acquisition, full-cycle recruiting, onboarding, employee relations, performance management, compensation and benefits, payroll, HR policies, labor law compliance, workforce planning.',
            'Soft skills: interpersonal communication, conflict resolution, discretion, empathy, coaching.',
            'Tools: Workday, BambooHR, SAP SuccessFactors, Greenhouse, LinkedIn Recruiter.',
          ],
        },
        {
          heading: 'Healthcare resume keywords',
          paragraphs: ['Healthcare postings screen on licenses and clinical skills first. Put your license and its status where the posting asks for it.'],
          items: [
            'Hard skills: patient care, patient assessment, medication administration, infection control, care planning, triage, vital signs monitoring, clinical documentation, BLS, ACLS.',
            'Soft skills: compassion, bedside manner, teamwork, composure under pressure, patient education.',
            'Tools: Epic, Cerner, electronic health records (EHR), infusion pumps, telemetry monitors.',
          ],
        },
        {
          heading: 'Engineering resume keywords',
          paragraphs: ['Engineering postings name the discipline, the standards and the software. Mirror all three.'],
          items: [
            'Hard skills: mechanical design, CAD modeling, finite element analysis (FEA), root cause analysis, lean manufacturing, Six Sigma, quality control, technical drawings, project engineering, ISO 9001.',
            'Soft skills: analytical thinking, precision, safety awareness, cross-team coordination, technical writing.',
            'Tools: AutoCAD, SolidWorks, CATIA, MATLAB, ANSYS, PLC programming.',
          ],
        },
        {
          heading: 'Administrative resume keywords',
          paragraphs: ['Administrative postings reward breadth. List the office tasks and software from the posting that you handle every day.'],
          items: [
            'Hard skills: calendar management, scheduling, data entry, records management, travel coordination, office administration, invoicing, meeting minutes, front desk operations.',
            'Soft skills: organization, multitasking, written communication, reliability, customer service.',
            'Tools: Microsoft Office 365, Outlook, Excel, Google Workspace, Zoom, Microsoft Teams.',
          ],
        },
        {
          heading: 'How ATS scanners read keywords',
          paragraphs: [
            'An ATS first extracts the text of your resume and splits it into fields such as job titles, employers, dates, education and skills. Recruiters then search and filter those fields with the terms from the posting. Some systems also rank applicants by how closely the resume matches the posting.',
            "Matching rules differ from system to system. Many look for the exact phrase, some also catch plurals or close variants, and few understand that two different words mean the same thing. The safe approach is to use the posting's exact wording at least once and to write abbreviations in both forms.",
            'Here is how a few lines from one posting compare with lines from a resume:',
          ],
          table: {
            headers: ['Posting asks for', 'Resume says', 'Likely result'],
            rows: [
              ['3+ years of experience with Salesforce', 'Managed a 120-account pipeline in Salesforce from 2021 to 2025', 'Match: the tool and the years are both there'],
              ['Search engine optimization (SEO)', 'Grew organic traffic through SEO', 'Partial: write "search engine optimization (SEO)" once so both searches find it'],
              ['Stakeholder management', 'Worked with many different teams', 'No match: the phrase from the posting is missing'],
              ['Excel (pivot tables, VLOOKUP)', 'Advanced Excel: pivot tables, XLOOKUP', 'Partial: Excel and pivot tables match, VLOOKUP is missing'],
              ["Bachelor's degree in Accounting", 'BSc Accounting', 'Depends on the system: add "Bachelor of Science in Accounting"'],
            ],
          },
        },
        {
          heading: 'Where do you put keywords on a resume?',
          paragraphs: ['Spread the keywords across the sections a recruiter reads and the ATS indexes.'],
          items: [
            'Headline or target title: the job title from the posting, if it describes your work.',
            'Summary: the job title plus two or three must-have skills.',
            'Skills section: hard skills and tools, grouped and written as the posting writes them.',
            'Experience bullets: each key skill next to a result, for example "Cut month-end close from 8 to 5 days using NetSuite".',
            'Certifications and education: full names, with the abbreviation in brackets.',
          ],
        },
      ],
      faq: [
        {
          question: 'What are keywords in a resume?',
          answer: 'They are the skills, tools, certifications and job titles from a job posting that a recruiter searches for in the ATS. A resume that uses the same terms shows up in more searches and reads as a closer fit.',
        },
        {
          question: 'How many keywords should a resume have?',
          answer: 'There is no fixed number. Cover every must-have from the posting that you can back up, plus the nice-to-haves you really have. For most postings that means 10 to 20 terms, each used in context.',
        },
        {
          question: 'Do keywords for resume scanners need to match exactly?',
          answer: "It is safer if they do. Many ATS searches look for the exact phrase, so use the posting's wording at least once and include both the full form and the abbreviation.",
        },
        {
          question: 'Can I hide keywords in white text?',
          answer: 'It is not worth it. Modern systems and recruiters detect the trick, and the risk is a rejected application.',
        },
        {
          question: 'Should I change keywords for every application?',
          answer: 'Yes. Keep one base resume and adjust the summary, skills and bullet order for each posting so its must-have terms appear. Your experience stays the same; the wording and emphasis change.',
        },
        {
          question: 'How do I check which keywords my resume is missing?',
          answer: 'Run your resume through a free ATS checker. It shows how a parser reads the file and which parts need work, so you can fix them before you apply.',
        },
      ],
    },
  ), dateModified: '2026-11-17' },
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
      title: 'Ce este un CV funcțional?',
      description: 'CV-ul funcțional grupează informațiile pe competențe. Avantaje, dezavantaje și relația cu ATS.',
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
      title: 'What is a functional resume?',
      description: 'A functional resume groups information by skills. Advantages, drawbacks and how it fares with ATS.',
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
