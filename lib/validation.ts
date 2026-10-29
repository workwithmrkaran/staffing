import { z } from 'zod'
import {
  CANDIDATE_STATUSES, EMPLOYER_STATUSES, EXPERIENCE_OPTIONS, NOTICE_PERIODS,
  PASSPORT_OPTIONS, RELOCATION_OPTIONS, SECTORS, URGENCIES,
} from './types'

const text = (label: string, max = 200) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} is too long`)

const phone = z
  .string({ error: 'Phone number is required' })
  .trim()
  .regex(/^[+()\d\s-]{7,20}$/, 'Enter a valid phone number')

const email = z.string({ error: 'Email is required' }).trim().toLowerCase().pipe(z.email('Enter a valid email address')).pipe(z.string().max(254))

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null))

export const employerSchema = z.object({
  company_name: text('Company name'),
  contact_person: text('Contact person'),
  email,
  phone,
  role_title: text('Role title'),
  sector: z.enum(SECTORS, { error: 'Select a hiring sector' }),
  target_location: text('Target location'),
  urgency: z.enum(URGENCIES, { error: 'Select an urgency' }),
  notes: optionalText(2000),
})

export const candidateSchema = z.object({
  full_name: text('Full name'),
  email,
  phone,
  target_role: text('Target role'),
  experience_years: z.enum(EXPERIENCE_OPTIONS, { error: 'Select your experience' }),
  notice_period: z.enum(NOTICE_PERIODS, { error: 'Select your notice period' }),
  relocation_preference: z.enum(RELOCATION_OPTIONS, { error: 'Select a relocation preference' }),
  passport_status: z.enum(PASSPORT_OPTIONS, { error: 'Select your passport status' }),
  linkedin_url: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https?:\/\/([a-z0-9-]+\.)*linkedin\.com\//i.test(v), 'Enter a valid LinkedIn URL (https://linkedin.com/in/...)'),
})

export const updateSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('candidate'),
    id: z.uuid(),
    status: z.enum(CANDIDATE_STATUSES).optional(),
    note: z.string().trim().min(1).max(2000).optional(),
  }),
  z.object({
    kind: z.literal('employer'),
    id: z.uuid(),
    status: z.enum(EMPLOYER_STATUSES).optional(),
    note: z.string().trim().min(1).max(2000).optional(),
  }),
])

/** Converts FormData string fields into a plain object (files are ignored). */
export function formDataToObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') out[key] = value
  }
  return out
}

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid submission'
}
