// Comparison pages: Joben against the ways people write a CV today. Written to be
// accurate about the alternatives (no competitor prices or feature claims we cannot
// verify) and to say where the alternative is the better pick.
// Copy rules: no em dashes, no "X, not Y" phrasing.
import type { Guide, GuideContent } from './guides'

const DATE = '2026-10-16'

const compare = (ro: GuideContent, en: GuideContent): Guide => ({
  kind: 'compare',
  datePublished: DATE,
  dateModified: DATE,
  content: { ro, en },
})

export const COMPARISONS: Guide[] = [
  compare(
    {
      slug: 'joben-vs-word',
      title: 'Joben sau Word pentru CV: ce alegi?',
      description: 'Joben comparat cu un șablon de CV în Word sau Google Docs: control, verificare ATS, adaptare la anunț și când e mai bun fiecare.',
      answer:
        'Word și Google Docs sunt gratuite și îți dau control total asupra formei, iar Joben adaugă verificarea ATS, ajutor AI la formularea punctelor și adaptarea la anunț. Alege Word dacă ai deja un CV bun și vrei doar să-l actualizezi. Alege Joben dacă vrei să verifici cum îl citește un ATS și să scrii mai repede versiuni pentru anunțuri diferite.',
      sections: [
        {
          heading: 'Ce face fiecare?',
          paragraphs: [
            'Word și Google Docs sunt editoare generale: scrii liber și alegi singur forma. Libertatea vine cu răspunderea formatului, iar un șablon cu tabele sau coloane poate fi citit greșit de un ATS.',
            'Joben este un constructor de CV cu șabloane pe o singură coloană, export PDF cu text selectabil, scanare ATS gratuită cu scor de la 0 la 100, ajutor AI pentru puncte și scrisori și adaptare la un anunț.',
          ],
        },
        {
          heading: 'Unde este mai bun Word?',
          paragraphs: [
            'Control total asupra aspectului, nicio dependență de un cont, fișiere pe care le ții local și un instrument pe care îl știi deja. Pentru un CV de bază, deja bine scris, este o alegere rezonabilă.',
          ],
        },
        {
          heading: 'Unde este mai bun Joben?',
          paragraphs: [
            'Verifici cum îl citește un ATS înainte să aplici, primești sugestii de formulare pentru puncte slabe și poți ține mai multe versiuni adaptate la anunțuri diferite. Scanarea ATS este gratuită și nu cere cont.',
          ],
        },
        {
          heading: 'Cine ar trebui să aleagă ce?',
          paragraphs: [
            'Folosește Word dacă CV-ul tău este gata și ai nevoie doar de modificări mici. Încearcă Joben dacă aplici la multe anunțuri, dacă vrei un al doilea ochi asupra textului sau dacă nu știi cum îl vede un ATS. Poți combina: scrie în Word și verifică fișierul în scanarea gratuită.',
          ],
        },
      ],
      faq: [
        {
          question: 'Pot scana un CV făcut în Word?',
          answer: 'Da. Încarci PDF-ul sau DOCX-ul în scanarea ATS gratuită Joben și primești scorul și punctele de reparat, fără cont.',
        },
        {
          question: 'Cât costă Joben?',
          answer: 'Există un plan gratuit. Planurile plătite includ un Pass de 14 zile și Pro, cu prețurile afișate pe pagina de prețuri.',
        },
      ],
    },
    {
      slug: 'joben-vs-word-template',
      title: 'Joben vs a Word template for your resume',
      description: 'Joben compared with a Word or Google Docs resume template: control, ATS checking, tailoring to postings and when each fits best.',
      answer:
        'Word and Google Docs are free and give you total control over the layout, while Joben adds ATS checking, AI help with wording and tailoring to a posting. Pick Word if you already have a good resume and only need to update it. Pick Joben if you want to check how an ATS reads it and write versions for different postings faster.',
      sections: [
        {
          heading: 'What does each do?',
          paragraphs: [
            'Word and Google Docs are general editors: you write freely and choose the form yourself. That freedom comes with responsibility for the format, and a template with tables or columns can be misread by an ATS.',
            'Joben is a resume builder with single-column templates, PDF export with selectable text, a free ATS scan with a 0 to 100 score, AI help for bullets and cover letters and tailoring to a posting.',
          ],
        },
        {
          heading: 'Where is Word better?',
          paragraphs: [
            'Total control over appearance, no account needed, files kept locally and a tool you already know. For a base resume that is already well written, it is a reasonable choice.',
          ],
        },
        {
          heading: 'Where is Joben better?',
          paragraphs: [
            'You check how an ATS reads it before you apply, get wording suggestions for weak bullets and can keep several versions tailored to different postings. The ATS scan is free and needs no account.',
          ],
        },
        {
          heading: 'Who should pick what?',
          paragraphs: [
            'Use Word if your resume is ready and needs small edits. Try Joben if you apply to many postings, want a second pair of eyes on the text or do not know how an ATS sees it. You can combine them: write in Word and check the file in the free scan.',
          ],
        },
      ],
      faq: [
        {
          question: 'Can I scan a resume made in Word?',
          answer: 'Yes. Upload the PDF or DOCX to the free Joben ATS scan and get the score and the points to fix, with no account.',
        },
        {
          question: 'How much does Joben cost?',
          answer: 'There is a free plan. Paid plans include a 14-day Pass and Pro, with prices shown on the pricing page.',
        },
      ],
    },
  ),
  compare(
    {
      slug: 'joben-vs-europass',
      title: 'Joben sau editorul Europass: diferențe și alegere',
      description: 'Joben comparat cu editorul oficial Europass: format, cine îl cere, citirea de către ATS și când folosești fiecare.',
      answer:
        'Editorul Europass produce CV-ul în formatul european standard, util când un anunț sau o instituție îl cere. Joben produce un CV modern, pe o singură coloană, cu verificare ATS și ajutor AI la formulare. Folosește Europass când este cerut explicit. Pentru restul candidaturilor, Joben oferă mai mult control și un scor ATS.',
      sections: [
        {
          heading: 'Ce face fiecare?',
          paragraphs: [
            'Editorul oficial Europass te ghidează prin secțiunile formatului european și generează un document standardizat. Este gratuit și recunoscut de instituții.',
            'Joben ține conținutul tău într-un șablon modern, îl verifică pentru ATS și te ajută să rescrii punctele și să adaptezi CV-ul la un anunț.',
          ],
        },
        {
          heading: 'Unde este mai bun Europass?',
          paragraphs: [
            'La concursuri publice, burse, proiecte europene și oriunde formatul este cerut. În aceste cazuri, un CV Europass este alegerea corectă.',
          ],
        },
        {
          heading: 'Unde este mai bun Joben?',
          paragraphs: [
            'Pentru companii private, unde recrutorul apreciază un CV concis, cu realizări măsurabile. Joben îți permite să urci rezultatele în față, să scoți ce nu contează și să verifici cum îl citește un ATS.',
          ],
        },
      ],
      faq: [
        {
          question: 'Pot folosi ambele?',
          answer: 'Da. Păstrează un CV modern ca bază și completează Europass doar pentru anunțurile care îl cer.',
        },
        {
          question: 'Europass este citit bine de ATS?',
          answer: 'Depinde de fișier. Verifică exportul copiind textul într-un editor simplu sau încarcă-l în scanarea gratuită Joben.',
        },
      ],
    },
    {
      slug: 'joben-vs-europass-editor',
      title: 'Joben vs the Europass editor: differences and choice',
      description: 'Joben compared with the official Europass editor: format, who asks for it, ATS reading and when to use each.',
      answer:
        'The Europass editor produces a CV in the standard European format, useful when a posting or institution asks for it. Joben produces a modern single-column resume with ATS checking and AI help with wording. Use Europass when it is explicitly requested. For other applications, Joben gives more control and an ATS score.',
      sections: [
        {
          heading: 'What does each do?',
          paragraphs: [
            'The official Europass editor guides you through the sections of the European format and generates a standardized document. It is free and recognized by institutions.',
            'Joben keeps your content in a modern template, checks it for ATS and helps you rewrite bullets and tailor the resume to a posting.',
          ],
        },
        {
          heading: 'Where is Europass better?',
          paragraphs: [
            'For public-sector competitions, scholarships, EU projects and anywhere the format is requested. In those cases a Europass CV is the correct choice.',
          ],
        },
        {
          heading: 'Where is Joben better?',
          paragraphs: [
            'For private companies, where the recruiter values a concise resume with measurable achievements. Joben lets you move results up front, cut what does not matter and check how an ATS reads it.',
          ],
        },
      ],
      faq: [
        {
          question: 'Can I use both?',
          answer: 'Yes. Keep a modern resume as your base and fill in Europass only for postings that ask for it.',
        },
        {
          question: 'Does an ATS read Europass well?',
          answer: 'It depends on the file. Check the export by pasting its text into a plain editor or upload it to the free Joben scan.',
        },
      ],
    },
  ),
  compare(
    {
      slug: 'joben-vs-canva',
      title: 'Joben sau șabloane de design pentru CV (Canva)',
      description: 'Joben comparat cu șabloanele de CV din instrumente de design precum Canva: aspect, citirea de către ATS și când îți trebuie fiecare.',
      answer:
        'Instrumentele de design precum Canva oferă șabloane cu aspect distinct, potrivite pentru domenii creative. Multe șabloane folosesc coloane, pictograme și imagini, care pot încurca un ATS. Joben pornește de la un șablon pe o singură coloană, cu text real, și verifică lizibilitatea pentru ATS. Alege design pentru portofolii creative și Joben pentru candidaturi prin sisteme ATS.',
      sections: [
        {
          heading: 'Ce face fiecare?',
          paragraphs: [
            'Canva este un instrument general de design cu șabloane pentru multe tipuri de materiale, inclusiv CV-uri. Accentul cade pe aspect.',
            'Joben este construit pentru CV și scrisori, cu accent pe lizibilitate pentru ATS și pe conținut: puncte, rezumat, adaptare la anunț.',
          ],
        },
        {
          heading: 'Unde este mai bun un instrument de design?',
          paragraphs: [
            'La domenii creative (design, artă, comunicare vizuală) unde aspectul CV-ului face parte din dovada de talent, și la materiale trimise direct unei persoane, nu unui sistem.',
          ],
        },
        {
          heading: 'Unde este mai bun Joben?',
          paragraphs: [
            'La aplicările online prin sisteme ATS. Șablonul pe o singură coloană, cu text selectabil, reduce riscul ca informațiile să fie amestecate la parsare, iar scanarea gratuită îți arată problemele rămase.',
          ],
        },
        {
          heading: 'Cum le combin?',
          paragraphs: [
            'Păstrează un CV simplu, optimizat pentru ATS, pentru aplicările online, și o versiune cu design pentru trimis direct unui recrutor sau pentru portofoliu.',
          ],
        },
      ],
      faq: [
        {
          question: 'Un CV din Canva este respins de ATS?',
          answer: 'Nu automat. Depinde de șablon și de export. Un PDF cu text real și o singură coloană se citește bine, iar unul cu coloane și imagini poate fi citit greșit. Verifică în scanarea gratuită.',
        },
        {
          question: 'Pot importa un CV existent în Joben?',
          answer: 'Da, poți încărca un CV existent, iar conținutul este preluat în editor. Verifică apoi rezultatul și corectează ce nu a fost recunoscut.',
        },
      ],
    },
    {
      slug: 'joben-vs-canva-resume-templates',
      title: 'Joben vs design-tool resume templates (Canva)',
      description: 'Joben compared with resume templates from design tools such as Canva: appearance, ATS reading and when you need each.',
      answer:
        'Design tools such as Canva offer templates with a distinctive look, suited to creative fields. Many templates use columns, icons and images, which can confuse an ATS. Joben starts from a single-column template with real text and checks ATS readability. Pick a design tool for creative portfolios and Joben for applications that go through ATS systems.',
      sections: [
        {
          heading: 'What does each do?',
          paragraphs: [
            'Canva is a general design tool with templates for many kinds of material, including resumes. The emphasis is on appearance.',
            'Joben is built for resumes and cover letters, with emphasis on ATS readability and on content: bullets, summary, tailoring to a posting.',
          ],
        },
        {
          heading: 'Where is a design tool better?',
          paragraphs: [
            'In creative fields (design, art, visual communication) where the look of the resume is part of the proof of talent, and for material sent directly to a person instead of a system.',
          ],
        },
        {
          heading: 'Where is Joben better?',
          paragraphs: [
            'For online applications through ATS systems. A single-column template with selectable text lowers the risk of information getting scrambled at parsing, and the free scan shows the issues that remain.',
          ],
        },
        {
          heading: 'How do I combine them?',
          paragraphs: [
            'Keep a plain, ATS-optimized resume for online applications and a designed version to send directly to a recruiter or to use as a portfolio piece.',
          ],
        },
      ],
      faq: [
        {
          question: 'Does an ATS reject a Canva resume?',
          answer: 'Not automatically. It depends on the template and export. A PDF with real text and a single column reads well, while one with columns and images can be misread. Check it in the free scan.',
        },
        {
          question: 'Can I import an existing resume into Joben?',
          answer: 'Yes, you can upload an existing resume and its content is brought into the editor. Then review the result and fix anything that was not recognized.',
        },
      ],
    },
  ),
]
