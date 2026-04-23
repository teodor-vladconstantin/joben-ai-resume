import { describe, expect, it } from 'vitest'
import { parseResumeTextToData, reconstructLines } from '@/lib/resume-parser'

describe('resume parser multilingual support', () => {
  it('reconstructs lines from mixed coordinates', () => {
    const lines = reconstructLines([
      { str: 'Ion', x: 10, y: 200 },
      { str: 'Popescu', x: 40, y: 200 },
      { str: 'Software Engineer', x: 10, y: 190 },
    ])

    expect(lines).toEqual(['Ion Popescu', 'Software Engineer'])
  })

  it('reconstructs two-column lines without merging unrelated text', () => {
    const lines = reconstructLines([
      { str: 'EXPERIENCE', x: 20, y: 700 },
      { str: 'SKILLS', x: 350, y: 700 },
      { str: 'Senior Engineer', x: 20, y: 680 },
      { str: 'TypeScript, Node.js', x: 350, y: 680 },
    ])

    expect(lines).toEqual(['EXPERIENCE', 'SKILLS', 'Senior Engineer', 'TypeScript, Node.js'])
  })

  it('maps romanian section headers and parses experience bullets', () => {
    const input = [
      'Ion Popescu',
      'Software Engineer',
      'ion.popescu@example.com',
      '+40 712 123 456',
      'EXPERIENTA PROFESIONALA',
      'Perioada: 2022 - Present',
      'Functia: Software Engineer',
      'Angajator: Acme SRL',
      'Atributii:',
      '- Built internal tooling for recruiters',
      '- Reduced report generation time by 40%',
      'EDUCATIE SI FORMARE',
      'Universitatea Politehnica Bucuresti',
      'Licenta in Informatica (2018 - 2022)',
      'ABILITATI',
      'TypeScript, Next.js, SQL',
    ]

    const parsed = parseResumeTextToData(input)

    expect(parsed.personal.firstName).toBe('Ion')
    expect(parsed.personal.lastName).toBe('Popescu')
    expect(parsed.personal.email).toContain('ion.popescu@example.com')

    expect(parsed.experience.length).toBeGreaterThan(0)
    expect(parsed.experience[0]?.title.toLowerCase()).toContain('software')
    expect(parsed.experience[0]?.company.toLowerCase()).toContain('acme')
    expect(parsed.experience[0]?.bullets?.length || 0).toBeGreaterThan(0)

    const dynamicSections = parsed.dynamicSections || []
    const educationSection = dynamicSections.find((section) => section.type === 'education')
    const skillsSection = dynamicSections.find((section) => section.type === 'skills')

    expect(educationSection).toBeTruthy()
    expect(skillsSection).toBeTruthy()
    expect(skillsSection?.content).toContain('• TypeScript')
  })

  // ── LinkedIn / GitHub / website extraction ──────────────────────────────────

  it('extracts linkedin profile from header', () => {
    const input = [
      'Ana Maria Ionescu',
      'Product Manager',
      'ana@example.com',
      'linkedin.com/in/anaionescu',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.personal.linkedin).toContain('anaionescu')
  })

  it('extracts linkedin with full https URL', () => {
    const input = [
      'Dan Dumitrescu',
      'Backend Developer',
      'dan@example.com',
      'https://www.linkedin.com/in/dandumitrescu',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.personal.linkedin).toContain('dandumitrescu')
    expect(parsed.personal.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\/in\//)
  })

  it('extracts github profile from header', () => {
    const input = [
      'Mihai Popa',
      'Full Stack Engineer',
      'mihai@example.com',
      'https://github.com/mihailabs',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.personal.github).toContain('mihailabs')
    expect(parsed.personal.github).toMatch(/^https:\/\/github\.com\//)
  })

  it('extracts portfolio website and does not confuse it with linkedin/github', () => {
    const input = [
      'Elena Marin',
      'UX Designer',
      'elena@example.com',
      'https://elenamarin.design',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.personal.website).toContain('elenamarin.design')
    expect(parsed.personal.linkedin).toBeUndefined()
    expect(parsed.personal.github).toBeUndefined()
  })

  it('extracts all three contact URLs simultaneously', () => {
    const input = [
      'Alex Radu',
      'DevOps Engineer',
      'alex@example.com',
      'linkedin.com/in/alexradu | github.com/alexradu | https://alexradu.io',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.personal.linkedin).toContain('alexradu')
    expect(parsed.personal.github).toContain('alexradu')
    expect(parsed.personal.website).toContain('alexradu.io')
  })

  // ── Location extraction ─────────────────────────────────────────────────────

  it('extracts city and country from header', () => {
    const input = [
      'Cristina Vasile',
      'Data Scientist',
      'cristina@example.com',
      'Cluj-Napoca, Romania',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.personal.location).toContain('Cluj-Napoca')
  })

  it('extracts city and country for english cv', () => {
    const input = [
      'James Walker',
      'Software Engineer',
      'james@example.com',
      'London, United Kingdom',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.personal.location).toContain('London')
  })

  // ── Company suffix detection ────────────────────────────────────────────────

  it('detects company with SRL suffix in experience', () => {
    const input = [
      'EXPERIENCE',
      '2021 - Present',
      'Senior Developer',
      'TechSoft SRL',
      '→ Built microservices architecture',
      '→ Led team of 5 engineers',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience.length).toBeGreaterThan(0)
    expect(parsed.experience[0]?.company).toContain('TechSoft')
  })

  it('detects company with LLC suffix in experience', () => {
    const input = [
      'WORK EXPERIENCE',
      '2020 - 2022',
      'QA Engineer',
      'Global Testing LLC',
      '• Automated regression suite',
      '• Reduced defect escape rate by 30%',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience.length).toBeGreaterThan(0)
    expect(parsed.experience[0]?.company.toLowerCase()).toContain('global testing')
  })

  it('detects company with Inc. suffix in experience', () => {
    const input = [
      'EXPERIENCE',
      '2019 - 2021',
      'Frontend Developer',
      'InnovateTech Inc.',
      '✓ Redesigned dashboard UI',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience.length).toBeGreaterThan(0)
    expect(parsed.experience[0]?.company).toContain('InnovateTech')
  })

  // ── Extended bullet characters ──────────────────────────────────────────────

  it('parses arrow bullet points (→)', () => {
    const input = [
      'EXPERIENCE',
      '2022 - Present',
      'Backend Engineer',
      'Acme Corp',
      '→ Designed REST APIs',
      '→ Improved query performance by 60%',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience[0]?.bullets?.length).toBeGreaterThanOrEqual(2)
    expect(parsed.experience[0]?.bullets?.some((b) => b.includes('REST APIs'))).toBe(true)
  })

  it('parses checkmark bullet points (✓)', () => {
    const input = [
      'EXPERIENCE',
      '2020 - 2022',
      'DevOps Engineer',
      'CloudOps Ltd',
      '✓ Set up CI/CD pipelines',
      '✓ Migrated infrastructure to Kubernetes',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience[0]?.bullets?.length).toBeGreaterThanOrEqual(2)
    expect(parsed.experience[0]?.bullets?.some((b) => b.includes('CI/CD'))).toBe(true)
  })

  it('parses star bullet points (★)', () => {
    const input = [
      'EXPERIENCE',
      '2021 - 2023',
      'ML Engineer',
      'DataLabs GmbH',
      '★ Trained production NLP models',
      '★ Reduced inference latency by 40%',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience[0]?.bullets?.length).toBeGreaterThanOrEqual(2)
  })

  it('parses combined role/company/period line with separators', () => {
    const input = [
      'WORK EXPERIENCE',
      'Senior Software Engineer | Acme SRL | 01/2022 - Present',
      '• Built high-throughput APIs',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience.length).toBe(1)
    expect(parsed.experience[0]?.title).toContain('Senior Software Engineer')
    expect(parsed.experience[0]?.company).toContain('Acme')
    expect(parsed.experience[0]?.period).toContain('01/2022')
  })

  it('parses title and company when period is trailing in parentheses', () => {
    const input = [
      'EXPERIENCE',
      'Platform Engineer - Globex LLC (Jan 2021 - Dec 2023)',
      '• Improved deployment reliability',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience.length).toBe(1)
    expect(parsed.experience[0]?.title).toContain('Platform Engineer')
    expect(parsed.experience[0]?.company).toContain('Globex')
    expect(parsed.experience[0]?.period).toContain('2021')
  })

  it('merges wrapped bullet continuation lines into the same bullet', () => {
    const input = [
      'EXPERIENCE',
      '2022 - 2024',
      'Software Engineer',
      'Acme SRL',
      '• Designed internal billing workflow',
      'covering refunds and invoice reconciliation across regions.',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience[0]?.bullets?.length).toBe(1)
    expect(parsed.experience[0]?.bullets?.[0]).toContain('invoice reconciliation')
  })

  // ── New section types ───────────────────────────────────────────────────────

  it('maps LANGUAGES section to languages type', () => {
    const input = [
      'Maria Stan',
      'Project Manager',
      'maria@example.com',
      'EXPERIENCE',
      '2021 - Present',
      'Project Manager at Acme SRL',
      'LANGUAGES',
      'English - Advanced (C1)',
      'French - Intermediate (B2)',
      'Romanian - Native',
    ]

    const parsed = parseResumeTextToData(input)
    const langSection = parsed.dynamicSections?.find((s) => s.type === 'languages')
    expect(langSection).toBeTruthy()
    expect(langSection?.content).toContain('English')
  })

  it('maps LIMBI STRAINE section to languages type', () => {
    const input = [
      'Radu Ionescu',
      'Translator',
      'radu@example.com',
      'LIMBI STRAINE',
      'Engleza - avansat',
      'Franceza - intermediar',
    ]

    const parsed = parseResumeTextToData(input)
    const langSection = parsed.dynamicSections?.find((s) => s.type === 'languages')
    expect(langSection).toBeTruthy()
  })

  it('maps VOLUNTEER EXPERIENCE section to volunteer type', () => {
    const input = [
      'Paula Neagu',
      'Social Worker',
      'paula@example.com',
      'VOLUNTEER EXPERIENCE',
      '2020 - 2021',
      'Red Cross Romania',
      '- Coordinated disaster relief efforts',
    ]

    const parsed = parseResumeTextToData(input)
    const volSection = parsed.dynamicSections?.find((s) => s.type === 'volunteer')
    expect(volSection).toBeTruthy()
  })

  it('maps HOBBIES AND INTERESTS section to interests type', () => {
    const input = [
      'Ion Marin',
      'Software Engineer',
      'ion@example.com',
      'HOBBIES AND INTERESTS',
      'Rock climbing, Chess, Open source contribution',
    ]

    const parsed = parseResumeTextToData(input)
    const interestsSection = parsed.dynamicSections?.find((s) => s.type === 'interests')
    expect(interestsSection).toBeTruthy()
    expect(interestsSection?.content).toContain('Chess')
  })

  it('maps REFERENCES section to references type', () => {
    const input = [
      'Victor Mihai',
      'Finance Manager',
      'victor@example.com',
      'REFERENCES',
      'Available upon request',
    ]

    const parsed = parseResumeTextToData(input)
    const refSection = parsed.dynamicSections?.find((s) => s.type === 'references')
    expect(refSection).toBeTruthy()
  })

  it('maps ASSOCIATIONS section to associations type', () => {
    const input = [
      'Laura Dima',
      'Lawyer',
      'laura@example.com',
      'PROFESSIONAL MEMBERSHIPS',
      'Romanian Bar Association (2018 - present)',
      'International Bar Association',
    ]

    const parsed = parseResumeTextToData(input)
    const assocSection = parsed.dynamicSections?.find((s) => s.type === 'associations')
    expect(assocSection).toBeTruthy()
  })

  // ── Date range variations ───────────────────────────────────────────────────

  it('parses ongoing / till date as valid period endpoints', () => {
    const input = [
      'EXPERIENCE',
      '2022 - Ongoing',
      'CTO',
      'StartupXYZ SRL',
      '• Led product strategy',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience.length).toBeGreaterThan(0)
    expect(parsed.experience[0]?.period).toContain('2022')
  })

  it('parses "2021 - To date" as a valid period', () => {
    const input = [
      'EXPERIENCE',
      '2021 - To date',
      'Head of Engineering',
      'Megacorp Ltd',
      '• Scaled team from 3 to 20 engineers',
    ]

    const parsed = parseResumeTextToData(input)
    expect(parsed.experience[0]?.period).toContain('2021')
  })

  // ── Comprehensive CV fixture ────────────────────────────────────────────────

  it('parses a full english CV with all section types', () => {
    const input = [
      'Sarah Johnson',
      'Senior Software Engineer',
      'sarah@example.com',
      '+1 555 123 4567',
      'San Francisco, USA',
      'linkedin.com/in/sarahjohnson',
      'github.com/sjohnson',

      'SUMMARY',
      'Experienced engineer with 8 years in distributed systems.',

      'WORK EXPERIENCE',
      '2020 - Present',
      'Senior Software Engineer',
      'Google LLC',
      '→ Led migration to microservices, reducing latency by 35%',
      '→ Mentored 4 junior engineers',

      '2017 - 2020',
      'Software Engineer',
      'Stripe Inc.',
      '→ Built payment reconciliation service processing $50M/day',

      'EDUCATION',
      'BSc Computer Science (2013 - 2017)',
      'MIT, Cambridge',

      'SKILLS',
      'Go, Python, TypeScript, Kubernetes, PostgreSQL, Redis',

      'LANGUAGES',
      'English - Native, Spanish - Intermediate',

      'CERTIFICATIONS',
      'AWS Solutions Architect (2022)',
      'Google Cloud Professional (2021)',

      'INTERESTS',
      'Rock climbing, Open source, Chess',

      'REFERENCES',
      'Available upon request',
    ]

    const parsed = parseResumeTextToData(input)

    // Personal
    expect(parsed.personal.firstName).toBe('Sarah')
    expect(parsed.personal.email).toBe('sarah@example.com')
    expect(parsed.personal.location).toContain('San Francisco')
    expect(parsed.personal.linkedin).toContain('sarahjohnson')
    expect(parsed.personal.github).toContain('sjohnson')
    expect(parsed.personal.summary).toContain('distributed systems')

    // Experience
    expect(parsed.experience.length).toBe(2)
    expect(parsed.experience[0]?.company).toContain('Google')
    expect(parsed.experience[0]?.bullets?.some((b) => b.includes('microservices'))).toBe(true)
    expect(parsed.experience[1]?.company).toContain('Stripe')

    // Dynamic sections
    const types = parsed.dynamicSections?.map((s) => s.type) ?? []
    expect(types).toContain('education')
    expect(types).toContain('skills')
    expect(types).toContain('languages')
    expect(types).toContain('certifications')
    expect(types).toContain('interests')
    expect(types).toContain('references')

    // Skills deduplication & formatting
    const skillsSection = parsed.dynamicSections?.find((s) => s.type === 'skills')
    expect(skillsSection?.content).toContain('• Go')
    expect(skillsSection?.content).toContain('• Python')

    // Languages uses skills formatter
    const langSection = parsed.dynamicSections?.find((s) => s.type === 'languages')
    expect(langSection?.content).toContain('English')
  })

  it('parses a full romanian CV with all section types', () => {
    const input = [
      'Andrei Gheorghe',
      'Inginer Software Senior',
      'andrei.gheorghe@email.ro',
      '+40 723 456 789',
      'Bucuresti, Romania',
      'linkedin.com/in/andreigheorghe',

      'PROFIL PROFESIONAL',
      'Inginer cu 6 ani experienta in dezvoltare web si mobile.',

      'EXPERIENTA PROFESIONALA',
      'Perioada: 2021 - Prezent',
      'Functia: Tech Lead',
      'Angajator: BitSoft SRL',
      'Atributii:',
      '- Coordonare echipa de 8 developeri',
      '- Implementare arhitectura microservicii',

      'Perioada: 2018 - 2021',
      'Functia: Software Developer',
      'Angajator: WebFactory SA',
      'Atributii:',
      '- Dezvoltare aplicatii React',

      'EDUCATIE SI FORMARE',
      'Perioada: 2014 - 2018',
      'Calificarea obtinuta: Licenta Informatica',
      'Institutia: Universitatea Politehnica Bucuresti',

      'COMPETENTE TEHNICE',
      'TypeScript, React, Node.js, PostgreSQL, Docker',

      'LIMBI STRAINE',
      'Engleza - avansat (C1)',
      'Franceza - intermediar (B2)',

      'CERTIFICARI',
      'AWS Cloud Practitioner (2022)',

      'INTERESE',
      'Robotica, Fotografie, Ciclism',

      'VOLUNTARIAT',
      '2019 - 2020',
      'Code for Romania',
      '- Dezvoltare platforma civica',

      'REFERINTE',
      'Disponibile la cerere',
    ]

    const parsed = parseResumeTextToData(input)

    // Personal
    expect(parsed.personal.firstName).toBe('Andrei')
    expect(parsed.personal.lastName).toBe('Gheorghe')
    expect(parsed.personal.email).toBe('andrei.gheorghe@email.ro')
    expect(parsed.personal.location).toContain('Bucuresti')
    expect(parsed.personal.linkedin).toContain('andreigheorghe')

    // Summary
    expect(parsed.personal.summary).toContain('Inginer')

    // Experience
    expect(parsed.experience.length).toBeGreaterThanOrEqual(2)
    const firstJob = parsed.experience[0]
    expect(firstJob?.title).toContain('Tech Lead')
    expect(firstJob?.company).toContain('BitSoft')
    expect(firstJob?.bullets?.some((b) => b.includes('echipa'))).toBe(true)

    // Dynamic sections
    const types = parsed.dynamicSections?.map((s) => s.type) ?? []
    expect(types).toContain('education')
    expect(types).toContain('skills')
    expect(types).toContain('languages')
    expect(types).toContain('certifications')
    expect(types).toContain('interests')
    expect(types).toContain('volunteer')
    expect(types).toContain('references')

    const skillsSection = parsed.dynamicSections?.find((s) => s.type === 'skills')
    expect(skillsSection?.content).toContain('• TypeScript')
  })
})
