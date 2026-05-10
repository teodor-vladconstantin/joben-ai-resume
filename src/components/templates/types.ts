export type ResumePersonal = {
  firstName: string
  lastName: string
  title: string
  email: string
  phone: string
  summary: string
  location?: string
  linkedin?: string
  github?: string
  website?: string
}

export type ResumeExperience = {
  id: string
  title: string
  company: string
  period: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent?: boolean
  description: string
  bullets?: string[]
}

export type ResumeProject = {
  id: string
  name: string
  role?: string
  period?: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent?: boolean
  description: string
  bullets?: string[]
  technologies: string[]
  url?: string
}

export type ResumeEducation = {
  id: string
  institution: string
  degree?: string
  field?: string
  location?: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent?: boolean
  /** Free-form additional details (GPA, honors, coursework, etc.) */
  description?: string
}

export type ResumeDynamicSection = {
  id: string
  type: string
  title: string
  content: string
}

export type ResumeTemplateData = {
  personal: ResumePersonal
  experience: ResumeExperience[]
  projects?: ResumeProject[]
  education?: ResumeEducation[]
  dynamicSections?: ResumeDynamicSection[]
}
