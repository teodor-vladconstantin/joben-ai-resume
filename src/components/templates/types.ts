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
  description: string
  bullets?: string[]
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
  dynamicSections?: ResumeDynamicSection[]
}
