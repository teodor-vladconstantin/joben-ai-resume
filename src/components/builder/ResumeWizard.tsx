"use client"

import { useState } from 'react'
import { useForm, useWatch, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

const yearRe = /^\d{4}$/
const required = z.string().trim().min(1, 'required')
const optionalYear = z.string().trim().refine((v) => v === '' || yearRe.test(v), 'year')

const schema = z
  .object({
    jobRole: required.max(120),
    firstName: required.max(80),
    lastName: required.max(80),
    email: z.string().trim().pipe(z.email('email')),
    phone: z.string().trim().max(40),
    location: z.string().trim().max(120),
    noExperience: z.boolean(),
    expTitle: z.string().trim().max(120),
    expCompany: z.string().trim().max(120),
    expStartYear: optionalYear,
    expEndYear: optionalYear,
    expCurrent: z.boolean(),
    expDescription: z.string().trim().max(2000),
    eduInstitution: required.max(160),
    eduDegree: z.string().trim().max(120),
    eduField: z.string().trim().max(120),
    eduEndYear: optionalYear,
  })
  .superRefine((v, ctx) => {
    if (v.noExperience) return
    if (!v.expTitle) ctx.addIssue({ code: 'custom', path: ['expTitle'], message: 'required' })
    if (!v.expCompany) ctx.addIssue({ code: 'custom', path: ['expCompany'], message: 'required' })
    if (!yearRe.test(v.expStartYear)) ctx.addIssue({ code: 'custom', path: ['expStartYear'], message: 'year' })
    if (!v.expCurrent && v.expStartYear && v.expEndYear && Number(v.expEndYear) < Number(v.expStartYear)) {
      ctx.addIssue({ code: 'custom', path: ['expEndYear'], message: 'yearOrder' })
    }
  })

type WizardValues = z.infer<typeof schema>
type FieldName = FieldPath<WizardValues>
type TextFieldName = Exclude<FieldName, 'noExperience' | 'expCurrent'>

const STEPS: { key: 'role' | 'contact' | 'experience' | 'education'; fields: FieldName[] }[] = [
  { key: 'role', fields: ['jobRole'] },
  { key: 'contact', fields: ['firstName', 'lastName', 'email', 'phone', 'location'] },
  { key: 'experience', fields: ['noExperience', 'expTitle', 'expCompany', 'expStartYear', 'expEndYear', 'expDescription'] },
  { key: 'education', fields: ['eduInstitution', 'eduDegree', 'eduField', 'eduEndYear'] },
]

const defaults: WizardValues = {
  jobRole: '', firstName: '', lastName: '', email: '', phone: '', location: '',
  noExperience: false, expTitle: '', expCompany: '', expStartYear: '', expEndYear: '', expCurrent: false, expDescription: '',
  eduInstitution: '', eduDegree: '', eduField: '', eduEndYear: '',
}

const num = (v: string): number | undefined => (v ? Number(v) : undefined)

// Same shape as `initialResumeData` in ResumeBuilder, so the editor loads it unchanged.
function buildResumeData(v: WizardValues) {
  const bullets = v.expDescription.split('\n').map((l) => l.trim()).filter(Boolean)
  const stamp = Date.now()
  const endLabel = v.expCurrent ? 'Present' : v.expEndYear
  return {
    template: 'harvard',
    personal: {
      firstName: v.firstName,
      lastName: v.lastName,
      title: v.jobRole,
      email: v.email,
      phone: v.phone,
      summary: '',
      location: v.location,
      linkedin: '',
      github: '',
    },
    experience: v.noExperience
      ? []
      : [{
          id: `exp_${stamp}`,
          title: v.expTitle,
          company: v.expCompany,
          period: endLabel ? `${v.expStartYear} - ${endLabel}` : v.expStartYear,
          startYear: num(v.expStartYear),
          endYear: v.expCurrent ? undefined : num(v.expEndYear),
          isCurrent: v.expCurrent,
          description: bullets.join('\n'),
          bullets,
        }],
    projects: [],
    education: [{
      id: `edu_${stamp}`,
      institution: v.eduInstitution,
      degree: v.eduDegree,
      field: v.eduField,
      endYear: num(v.eduEndYear),
    }],
    dynamicSections: [],
    importMeta: { pdfImportsCount: 0 },
  }
}

export function ResumeWizard() {
  const t = useTranslations('ResumeWizard')
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<WizardValues>({ resolver: zodResolver(schema), defaultValues: defaults, mode: 'onTouched' })
  const { register, trigger, setValue, control, formState: { errors } } = form
  const last = step === STEPS.length - 1
  const noExperience = useWatch({ control, name: 'noExperience' })
  const expCurrent = useWatch({ control, name: 'expCurrent' })

  const err = (name: FieldName): string | undefined => {
    const message = errors[name]?.message
    return typeof message === 'string' ? t(`errors.${message}` as 'errors.required') : undefined
  }

  const field = (name: TextFieldName, label: string, opts: { type?: string; autoComplete?: string; placeholder?: string; inputMode?: 'numeric' } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`w-${name}`}>{label}</Label>
      <Input
        id={`w-${name}`}
        type={opts.type ?? 'text'}
        autoComplete={opts.autoComplete}
        placeholder={opts.placeholder}
        inputMode={opts.inputMode}
        aria-invalid={Boolean(errors[name])}
        {...register(name)}
      />
      {err(name) && <p role="alert" className="text-xs text-destructive">{err(name)}</p>}
    </div>
  )

  async function next() {
    if (await trigger(STEPS[step].fields)) setStep(step + 1)
  }

  async function finish() {
    if (!(await trigger(STEPS[step].fields))) return
    setSubmitting(true)
    setSubmitError(null)
    const values = form.getValues()
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${values.firstName} ${values.lastName}`.trim(),
          data: buildResumeData(values),
          source: 'scratch',
        }),
      })
      const payload = (await res.json().catch(() => null)) as { resume?: { id?: string }; showUpgrade?: boolean } | null
      const id = payload?.resume?.id
      if (!res.ok || !id) {
        setSubmitError(payload?.showUpgrade ? t('errors.limit') : t('errors.create'))
        setSubmitting(false)
        return
      }
      router.replace(`/resumes/${id}`)
    } catch {
      setSubmitError(t('errors.create'))
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-(--foreground)">{t('title')}</h1>
      <p className="mt-1 text-sm text-(--muted)">{t('subtitle')}</p>

      <div className="mt-6">
        <Progress value={((step + 1) / STEPS.length) * 100} aria-label={t('progress', { current: step + 1, total: STEPS.length })} />
        <ol className="mt-3 grid grid-cols-4 text-xs">
          {STEPS.map((s, i) => (
            <li key={s.key} aria-current={i === step ? 'step' : undefined} className={i <= step ? 'font-semibold text-(--foreground)' : 'text-(--muted)'}>
              {t(`steps.${s.key}`)}
            </li>
          ))}
        </ol>
      </div>

      <Card radius="lg" className="mt-6 p-6">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void (last ? finish() : next())
          }}
          className="space-y-4"
        >
          <h2 className="font-bold text-(--foreground)">{t(`${STEPS[step].key}.heading` as 'role.heading')}</h2>

          {step === 0 && field('jobRole', t('role.label'), { placeholder: t('role.placeholder') })}

          {step === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {field('firstName', t('contact.firstName'), { autoComplete: 'given-name' })}
                {field('lastName', t('contact.lastName'), { autoComplete: 'family-name' })}
              </div>
              {field('email', t('contact.email'), { type: 'email', autoComplete: 'email' })}
              {field('phone', t('contact.phone'), { type: 'tel', autoComplete: 'tel' })}
              {field('location', t('contact.location'), { autoComplete: 'address-level2' })}
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox id="w-noExperience" checked={noExperience} onCheckedChange={(c) => setValue('noExperience', c === true, { shouldValidate: true })} />
                <Label htmlFor="w-noExperience">{t('experience.none')}</Label>
              </div>
              {!noExperience && (
                <>
                  {field('expTitle', t('experience.jobTitle'))}
                  {field('expCompany', t('experience.company'))}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field('expStartYear', t('experience.startYear'), { inputMode: 'numeric', placeholder: '2021' })}
                    {!expCurrent && field('expEndYear', t('experience.endYear'), { inputMode: 'numeric', placeholder: '2024' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="w-expCurrent" checked={expCurrent} onCheckedChange={(c) => setValue('expCurrent', c === true)} />
                    <Label htmlFor="w-expCurrent">{t('experience.current')}</Label>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="w-expDescription">{t('experience.description')}</Label>
                    <Textarea id="w-expDescription" rows={4} placeholder={t('experience.descriptionPlaceholder')} {...register('expDescription')} />
                  </div>
                </>
              )}
            </>
          )}

          {step === 3 && (
            <>
              {field('eduInstitution', t('education.institution'))}
              {field('eduDegree', t('education.degree'))}
              {field('eduField', t('education.field'))}
              {field('eduEndYear', t('education.endYear'), { inputMode: 'numeric', placeholder: '2023' })}
            </>
          )}

          {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" disabled={step === 0 || submitting} onClick={() => setStep(step - 1)}>
              {t('back')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <><Loader2 className="animate-spin" /> {t('creating')}</> : last ? t('finish') : t('next')}
            </Button>
          </div>
        </form>
      </Card>

      <p className="mt-4 text-center text-xs">
        <Link href="/resumes/new?blank=1" className="text-(--muted) underline hover:text-(--foreground)">{t('skip')}</Link>
      </p>
    </div>
  )
}
