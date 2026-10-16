// One-off generator for the downloadable CV templates in public/templates/*.docx.
// Run: node scripts/generate-cv-templates.mjs
// Output is committed; rerun only when the template copy changes. jszip is a
// transitive dependency (via mammoth), so this script is not part of the build.
// Templates follow the ATS rules from the guides: one column, no tables or text
// boxes, standard headings, contact details in the body, selectable text.
import JSZip from 'jszip'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('../public/templates/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const run = (text, { bold = false, size, color } = {}) =>
  `<w:r><w:rPr>${bold ? '<w:b/>' : ''}${color ? `<w:color w:val="${color}"/>` : ''}${size ? `<w:sz w:val="${size}"/>` : ''}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`

const p = (inner, { align, before = 0, after = 60, border = false, keepNext = false, bullet = false } = {}) =>
  `<w:p><w:pPr>${keepNext ? '<w:keepNext/>' : ''}${bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : ''}${
    border ? '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="808080"/></w:pBdr>' : ''
  }<w:spacing w:before="${before}" w:after="${after}"/>${align ? `<w:jc w:val="${align}"/>` : ''}</w:pPr>${inner}</w:p>`

const name = (t) => p(run(t, { bold: true, size: 36 }), { after: 40 })
const contact = (t) => p(run(t, { size: 20 }), { after: 120 })
const heading = (t) => p(run(t.toUpperCase(), { bold: true, size: 22 }), { before: 200, after: 80, border: true, keepNext: true })
const text = (t) => p(run(t, { size: 21 }))
const role = (title, dates) =>
  p(run(title, { bold: true, size: 21 }) + run(`    ${dates}`, { size: 21 }), { before: 80, after: 40, keepNext: true })
const bullet = (t) => p(run(t, { size: 21 }), { bullet: true, after: 40 })

const COPY = {
  ro: {
    contact: '[Oraș, Țară]  |  [+40 712 345 678]  |  [prenume.nume@email.com]  |  [linkedin.com/in/prenume-nume]',
    name: '[Prenume Nume]',
    h: {
      summary: 'Rezumat profesional',
      experience: 'Experiență profesională',
      education: 'Educație',
      skills: 'Competențe',
      keySkills: 'Competențe cheie',
      languages: 'Limbi străine',
      certs: 'Certificări',
      projects: 'Proiecte',
      practice: 'Experiență: practică și voluntariat',
      training: 'Proiecte și formare',
    },
    summaryClassic:
      '[2-3 propoziții: rolul tău, anii de experiență, două competențe cheie din anunț și ce post cauți. Rescrie-le pentru fiecare anunț.]',
    summaryStudent:
      '[2-3 propoziții: ce studiezi, ce competențe ai dovedit prin proiecte și ce tip de practică sau post cauți.]',
    summaryChange:
      '[2-3 propoziții: de unde vii, ce competențe transferabile aduci și către ce rol te îndrepți. Folosește titlul postului din anunț.]',
    role: '[Funcție]  |  [Companie], [Localitate]',
    dates: '[LL/AAAA] - [LL/AAAA]',
    bullets: [
      '[Verb de acțiune + ce ai făcut + rezultat măsurabil, de exemplu: Am redus timpul de procesare cu 30%.]',
      '[Realizare cu cifre: volum, procent, sumă sau termen.]',
      '[Unealta sau metoda folosită, cu numele exact din anunț.]',
    ],
    edu: '[Specializare], [Universitate], [Localitate]',
    eduDates: '[AAAA] - [AAAA]',
    eduLine: '[Opțional: media, lucrarea de licență sau cursuri relevante.]',
    skillsLines: [
      'Tehnice: [competență 1, competență 2, competență 3]',
      'Unelte: [program 1, program 2, program 3]',
      'Interpersonale: [competență cu exemplu scurt între paranteze]',
    ],
    langs: ['[Engleză: C1 (certificat, dacă ai)]', '[Altă limbă: B2]'],
    certs: ['[Numele certificării], [Instituția], [AAAA]'],
    project: '[Numele proiectului]  |  [Link, dacă e public]',
    projectBullets: [
      '[Problema rezolvată, într-o propoziție.]',
      '[Rolul tău, unelte folosite și rezultatul, cu cifre.]',
    ],
    practice: '[Organizația sau compania]  |  [Rol]',
    keyGroups: [
      ['[Competență transferabilă 1]', '[Exemplu cu rezultat: ce ai făcut și cu cât a crescut sau a scăzut ceva.]'],
      ['[Competență transferabilă 2]', '[Exemplu cu rezultat.]'],
      ['[Competență tehnică nouă]', '[Curs, certificare sau proiect care o dovedește.]'],
    ],
  },
  en: {
    contact: '[City, Country]  |  [+40 712 345 678]  |  [first.last@email.com]  |  [linkedin.com/in/first-last]',
    name: '[First Last]',
    h: {
      summary: 'Professional Summary',
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Skills',
      keySkills: 'Key Skills',
      languages: 'Languages',
      certs: 'Certifications',
      projects: 'Projects',
      practice: 'Experience: Internships and Volunteering',
      training: 'Projects and Training',
    },
    summaryClassic:
      '[2-3 sentences: your role, years of experience, two key skills from the posting and the role you want. Rewrite it for each posting.]',
    summaryStudent:
      '[2-3 sentences: what you study, which skills you have shown through projects and the type of internship or role you want.]',
    summaryChange:
      '[2-3 sentences: where you come from, which transferable skills you bring and which role you are heading for. Use the job title from the posting.]',
    role: '[Job Title]  |  [Company], [City]',
    dates: '[MM/YYYY] - [MM/YYYY]',
    bullets: [
      '[Action verb + what you did + measurable result, for example: Cut processing time by 30%.]',
      '[Achievement with numbers: volume, percentage, sum or deadline.]',
      '[Tool or method used, with the exact name from the posting.]',
    ],
    edu: '[Degree], [University], [City]',
    eduDates: '[YYYY] - [YYYY]',
    eduLine: '[Optional: GPA, thesis or relevant coursework.]',
    skillsLines: [
      'Technical: [skill 1, skill 2, skill 3]',
      'Tools: [software 1, software 2, software 3]',
      'Interpersonal: [skill with a short example in brackets]',
    ],
    langs: ['[English: C1 (certificate, if you have one)]', '[Another language: B2]'],
    certs: ['[Certification name], [Issuer], [YYYY]'],
    project: '[Project name]  |  [Link, if public]',
    projectBullets: [
      '[The problem it solves, in one sentence.]',
      '[Your role, tools used and the result, with numbers.]',
    ],
    practice: '[Organization or company]  |  [Role]',
    keyGroups: [
      ['[Transferable skill 1]', '[Example with a result: what you did and by how much something grew or fell.]'],
      ['[Transferable skill 2]', '[Example with a result.]'],
      ['[New technical skill]', '[Course, certification or project that proves it.]'],
    ],
  },
}

const experienceBlock = (c, jobs = 2) =>
  Array.from({ length: jobs }, () => [role(c.role, c.dates), ...c.bullets.map(bullet)]).flat()
const educationBlock = (c) => [role(c.edu, c.eduDates), text(c.eduLine)]
const skillsBlock = (c) => c.skillsLines.map(text)
const langsBlock = (c) => c.langs.map(bullet)

const BUILDERS = {
  classic: (c) => [
    name(c.name),
    contact(c.contact),
    heading(c.h.summary),
    text(c.summaryClassic),
    heading(c.h.experience),
    ...experienceBlock(c, 2),
    heading(c.h.education),
    ...educationBlock(c),
    heading(c.h.skills),
    ...skillsBlock(c),
    heading(c.h.languages),
    ...langsBlock(c),
    heading(c.h.certs),
    ...c.certs.map(bullet),
  ],
  student: (c) => [
    name(c.name),
    contact(c.contact),
    heading(c.h.summary),
    text(c.summaryStudent),
    heading(c.h.education),
    ...educationBlock(c),
    heading(c.h.projects),
    role(c.project, c.dates),
    ...c.projectBullets.map(bullet),
    role(c.project, c.dates),
    ...c.projectBullets.map(bullet),
    heading(c.h.practice),
    role(c.practice, c.dates),
    ...c.bullets.slice(0, 2).map(bullet),
    heading(c.h.skills),
    ...skillsBlock(c),
    heading(c.h.languages),
    ...langsBlock(c),
  ],
  'career-change': (c) => [
    name(c.name),
    contact(c.contact),
    heading(c.h.summary),
    text(c.summaryChange),
    heading(c.h.keySkills),
    ...c.keyGroups.flatMap(([title, body]) => [role(title, ''), text(body)]),
    heading(c.h.experience),
    ...experienceBlock(c, 2),
    heading(c.h.training),
    role(c.project, c.dates),
    ...c.projectBullets.map(bullet),
    heading(c.h.education),
    ...educationBlock(c),
    heading(c.h.languages),
    ...langsBlock(c),
  ],
}

const NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'

const documentXml = (body) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="1000" w:bottom="850" w:left="1000" w:header="450" w:footer="450" w:gutter="0"/></w:sectPr></w:body></w:document>`

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="21"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`

const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ${NS}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="260"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`

const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`

const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`

for (const lang of ['ro', 'en']) {
  for (const kind of Object.keys(BUILDERS)) {
    const zip = new JSZip()
    zip.file('[Content_Types].xml', contentTypes)
    zip.folder('_rels').file('.rels', rootRels)
    const word = zip.folder('word')
    word.file('document.xml', documentXml(BUILDERS[kind](COPY[lang])))
    word.file('styles.xml', stylesXml)
    word.file('numbering.xml', numberingXml)
    word.folder('_rels').file('document.xml.rels', docRels)
    const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    const file = `joben-cv-${kind}-${lang}.docx`
    writeFileSync(new URL(file, OUT), buf)
    console.log(file, buf.length)
  }
}
