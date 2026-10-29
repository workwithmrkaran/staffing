// Shared domain types and option lists used by the public forms, API routes and admin console.

export const SECTORS = ['IT', 'Non-IT', 'Leadership'] as const
export const URGENCIES = ['Immediate', '15-30 Days', 'Pipeline'] as const
export const EMPLOYER_STATUSES = ['New', 'Contacted', 'In Progress', 'Filled', 'Archived'] as const

export const EXPERIENCE_OPTIONS = ['0-2 years', '3-5 years', '6-9 years', '10+ years'] as const
export const NOTICE_PERIODS = ['Immediate', '15 Days', '30 Days', '60+ Days'] as const
export const RELOCATION_OPTIONS = ['Open to relocate', 'Current city only', 'Open to remote / hybrid', 'Open to international'] as const
export const PASSPORT_OPTIONS = ['Valid passport', 'Applied / in process', 'No passport'] as const
export const CANDIDATE_STATUSES = ['Pending', 'Reviewed', 'Shortlisted', 'Interviewing', 'Rejected'] as const

export type Sector = (typeof SECTORS)[number]
export type Urgency = (typeof URGENCIES)[number]
export type EmployerStatus = (typeof EMPLOYER_STATUSES)[number]
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number]

export interface EmployerRequirement {
  id: string
  created_at: string
  company_name: string
  contact_person: string
  email: string
  phone: string
  role_title: string
  sector: Sector
  target_location: string
  urgency: Urgency
  jd_file_id: string | null
  /** Attached file name and MIME type (included in admin listings). */
  file_name?: string | null
  file_mime?: string | null
  notes: string | null
  admin_notes: string | null
  status: EmployerStatus
}

export interface CandidateApplication {
  id: string
  created_at: string
  full_name: string
  email: string
  phone: string
  target_role: string
  experience_years: string
  notice_period: string
  relocation_preference: string
  passport_status: string
  linkedin_url: string | null
  resume_file_id: string
  /** Attached file name and MIME type (included in admin listings). */
  file_name?: string | null
  file_mime?: string | null
  admin_notes: string | null
  status: CandidateStatus
}

export type RecordKind = 'candidate' | 'employer'

export interface ApiResult {
  success: boolean
  message: string
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
