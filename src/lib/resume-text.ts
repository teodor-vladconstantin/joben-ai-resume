// Plain-text rendering of a stored resume for AI evaluation. It must carry
// every section with its heading: the previous version dropped education,
// projects and contact links and glued bullets with " | ", so the model
// reported "missing education" and penalised structure that was really there.

type Row = Record<string, unknown>

function isRecord(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function lines(value: unknown): string[] {
  return Array.isArray(value) ? value.map(str).filter(Boolean) : []
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function educationPeriod(entry: Row): string {
  const point = (month: unknown, year: unknown) =>
    typeof year === 'number' ? `${typeof month === 'number' ? `${MONTHS[month - 1]} ` : ''}${year}` : ''
  const start = point(entry.startMonth, entry.startYear)
  const end = entry.isCurrent ? 'Present' : point(entry.endMonth, entry.endYear)
  return [start, end].filter(Boolean).join(' - ')
}

function section(title: string, body: string[]): string[] {
  const content = body.filter(Boolean)
  return content.length > 0 ? ['', title.toUpperCase(), ...content] : []
}

export function resumeToPlainText(data: unknown): string {
  if (!isRecord(data)) return ''
  const personal = isRecord(data.personal) ? data.personal : {}

  const header = [
    `${str(personal.firstName)} ${str(personal.lastName)}`.trim(),
    str(personal.title),
    [personal.email, personal.phone, personal.location, personal.linkedin, personal.github, personal.website]
      .map(str)
      .filter(Boolean)
      .join(' | '),
  ]

  const experience = rows(data.experience).flatMap((entry) => {
    const bullets = lines(entry.bullets)
    const body = bullets.length > 0 ? bullets : lines([entry.description])
    const heading = [str(entry.title), str(entry.company)].filter(Boolean).join(', ')
    return [[heading, str(entry.period)].filter(Boolean).join(' | '), ...body.map((line) => `- ${line}`)]
  })

  const projects = rows(data.projects).flatMap((entry) => {
    const bullets = lines(entry.bullets)
    const body = bullets.length > 0 ? bullets : str(entry.description).split('\n').map((line) => line.trim()).filter(Boolean)
    const techs = lines(entry.technologies).join(', ')
    return [
      [str(entry.name), str(entry.role), str(entry.period)].filter(Boolean).join(' | '),
      ...body.map((line) => `- ${line}`),
      techs && `Technologies: ${techs}`,
      str(entry.url),
    ]
  })

  const education = rows(data.education).flatMap((entry) => [
    [str(entry.institution), str(entry.location), educationPeriod(entry)].filter(Boolean).join(' | '),
    [str(entry.degree), str(entry.field)].filter(Boolean).join(', '),
    str(entry.description),
  ])

  const extra = rows(data.dynamicSections).flatMap((entry) => section(str(entry.title) || str(entry.type), [str(entry.content)]))

  return [
    ...header,
    ...section('Summary', [str(personal.summary)]),
    ...section('Experience', experience),
    ...section('Projects', projects),
    ...section('Education', education),
    ...extra,
  ]
    .filter((line, index, all) => line !== '' || (index > 0 && all[index - 1] !== ''))
    .join('\n')
    .trim()
}
