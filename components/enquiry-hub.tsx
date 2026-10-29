'use client'

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { ArrowRight, Check, FileText, Loader2, Mail, Phone, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  EXPERIENCE_OPTIONS, MAX_UPLOAD_BYTES, NOTICE_PERIODS, PASSPORT_OPTIONS,
  RELOCATION_OPTIONS, SECTORS, URGENCIES, type ApiResult,
} from '@/lib/types'
import { PHOTOS, unsplash } from '@/lib/site'

type Tab = 'employer' | 'seeker'

interface FieldDef {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'url'
  required?: boolean
  placeholder?: string
  autoComplete?: string
}

interface SelectDef {
  name: string
  label: string
  options: readonly string[]
}

const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-100'
const selectClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-navy-500'
const labelClass = 'text-sm font-semibold text-[#061b3d]'

const FORMS: Record<Tab, {
  endpoint: string
  fileField: string
  fileLabel: string
  accept: string
  extensions: string[]
  fileRequired: boolean
  fields: FieldDef[]
  selects: SelectDef[]
  submitLabel: string
}> = {
  employer: {
    endpoint: '/api/submit-employer',
    fileField: 'jd_file',
    fileLabel: 'Upload Job Description (PDF or DOCX, optional)',
    accept: '.pdf,.docx',
    extensions: ['.pdf', '.docx'],
    fileRequired: false,
    fields: [
      { name: 'company_name', label: 'Company Name', type: 'text', required: true, autoComplete: 'organization' },
      { name: 'contact_person', label: 'Contact Person Full Name', type: 'text', required: true, autoComplete: 'name' },
      { name: 'email', label: 'Official Work Email', type: 'email', required: true, autoComplete: 'email' },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true, autoComplete: 'tel' },
      { name: 'role_title', label: 'Position / Role Title Needed', type: 'text', required: true },
      { name: 'target_location', label: 'Target Location', type: 'text', required: true },
    ],
    selects: [
      { name: 'sector', label: 'Hiring Sector', options: SECTORS },
      { name: 'urgency', label: 'Urgency', options: URGENCIES },
    ],
    submitLabel: 'Submit Hiring Requirement',
  },
  seeker: {
    endpoint: '/api/submit-candidate',
    fileField: 'resume_file',
    fileLabel: 'Upload Your Resume (PDF only)',
    accept: '.pdf',
    extensions: ['.pdf'],
    fileRequired: true,
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true, autoComplete: 'name' },
      { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel', required: true, autoComplete: 'tel' },
      { name: 'target_role', label: 'Target Role', type: 'text', required: true },
    ],
    selects: [
      { name: 'experience_years', label: 'Total Years of Experience', options: EXPERIENCE_OPTIONS },
      { name: 'notice_period', label: 'Notice Period', options: NOTICE_PERIODS },
      { name: 'relocation_preference', label: 'Relocation Preference', options: RELOCATION_OPTIONS },
      { name: 'passport_status', label: 'Passport Status', options: PASSPORT_OPTIONS },
    ],
    submitLabel: 'Send Profile to Talent Network',
  },
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function FileDrop({ label, accept, extensions, file, onFile, disabled }: {
  label: string
  accept: string
  extensions: string[]
  file: File | null
  onFile: (file: File | null) => void
  disabled: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept_ = (candidate: File | undefined) => {
    if (!candidate) return
    const name = candidate.name.toLowerCase()
    if (!extensions.some((ext) => name.endsWith(ext))) {
      toast.error(`Please upload a ${extensions.map((e) => e.slice(1).toUpperCase()).join(' or ')} file.`)
      return
    }
    if (candidate.size > MAX_UPLOAD_BYTES) {
      toast.error('File is too large. Maximum size is 10MB.')
      return
    }
    onFile(candidate)
  }
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    if (!disabled) accept_(event.dataTransfer.files[0])
  }
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    accept_(event.target.files?.[0])
    event.target.value = ''
  }

  return <label onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition ${dragging ? 'border-brand-500 bg-brand-50' : file ? 'border-navy-400 bg-navy-50/40' : 'border-slate-300 bg-slate-50 hover:border-navy-400 hover:bg-navy-50/40'}`}>
    <input ref={inputRef} type="file" accept={accept} className="sr-only" disabled={disabled} onChange={handleChange} />
    <FileText className="mb-2 size-6 text-navy-600" />
    <span className="text-sm font-semibold text-[#061b3d]">{file ? file.name : label}</span>
    <span className="mt-1 text-xs text-slate-500">{file ? `${formatSize(file.size)} · Click to replace` : 'Drag & drop or browse · Max 10MB'}</span>
    {file && !disabled && <button type="button" aria-label="Remove file" onClick={(e) => { e.preventDefault(); onFile(null) }} className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-brand-500"><X className="size-4" /></button>}
  </label>
}

export function EnquiryHub() {
  const [tab, setTab] = useState<Tab>('employer')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const config = FORMS[tab]

  const switchTab = (next: Tab) => {
    if (submitting) return
    setTab(next)
    setFile(null)
    setSent(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (config.fileRequired && !file) {
      toast.error('Please attach your resume before submitting.')
      return
    }
    const formEl = event.currentTarget
    const data = new FormData(formEl)
    if (file) data.set(config.fileField, file)

    setSubmitting(true)
    try {
      const response = await fetch(config.endpoint, { method: 'POST', body: data })
      const result = (await response.json().catch(() => null)) as ApiResult | null
      if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'Submission failed. Please try again.')
      }
      toast.success(result.message)
      formEl.reset()
      setFile(null)
      setSent(result.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-30px_rgba(6,27,61,.28)]"><div className="grid md:grid-cols-[.8fr_1.2fr]"><div className="bg-[#061b3d] p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-[.24em] text-brand-400">Start a conversation</p><h3 className="mt-3 text-3xl font-bold tracking-[-.04em] sm:text-4xl">The right hire changes everything.</h3><p className="mt-3 leading-7 text-slate-300">Tell us where your team is going. We’ll help you find the people who can take it there.</p><div className="mt-10 flex flex-col gap-4 text-sm text-slate-200"><a href="tel:+919896333317" className="flex items-center gap-3"><Phone className="size-4 text-brand-400" /> +91 98963 33317</a><a href="mailto:a3astaffingsolutions@gmail.com" className="flex items-center gap-3"><Mail className="size-4 text-brand-400" /> a3astaffingsolutions@gmail.com</a></div><img src={unsplash(PHOTOS.interviewOffice.id, 700, 520)} alt={PHOTOS.interviewOffice.alt} width={700} height={520} loading="lazy" className="mt-10 hidden aspect-[4/3] w-full rounded-2xl object-cover ring-1 ring-white/10 md:block" /></div><div className="p-6 sm:p-10">
    <div className="mb-7 flex rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => switchTab('employer')} className={`flex-1 rounded-lg px-3 py-3 text-sm font-bold transition ${tab === 'employer' ? 'bg-white text-[#061b3d] shadow-sm' : 'text-slate-500'}`}>For Employers</button><button type="button" onClick={() => switchTab('seeker')} className={`flex-1 rounded-lg px-3 py-3 text-sm font-bold transition ${tab === 'seeker' ? 'bg-white text-[#061b3d] shadow-sm' : 'text-slate-500'}`}>For Job Seekers</button></div>
    {sent ? <div className="flex min-h-[360px] flex-col items-center justify-center text-center"><div className="mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check /></div><h4 className="text-2xl font-bold text-[#061b3d]">Thank you for reaching out.</h4><p className="mt-2 max-w-sm text-slate-500">{sent}</p><button type="button" className="mt-6 text-sm font-bold text-navy-600" onClick={() => setSent(null)}>Submit another enquiry</button></div> :
    <form key={tab} onSubmit={submit} className="grid gap-4 sm:grid-cols-2" aria-busy={submitting}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <fieldset disabled={submitting} className="contents">
        {config.fields.map((field) => <label key={field.name} className={labelClass}>{field.label}<input name={field.name} required={field.required} type={field.type} autoComplete={field.autoComplete} placeholder={field.placeholder} maxLength={200} className={inputClass} /></label>)}
        {config.selects.map((select) => <label key={select.name} className={labelClass}>{select.label}<select name={select.name} required defaultValue="" className={selectClass}><option value="">Select one</option>{select.options.map((x) => <option key={x}>{x}</option>)}</select></label>)}
        {tab === 'seeker' && <label className={`${labelClass} sm:col-span-2`}>LinkedIn Profile URL <span className="font-normal text-slate-400">(optional)</span><input name="linkedin_url" type="url" placeholder="https://linkedin.com/in/your-profile" maxLength={300} className={inputClass} /></label>}
        {tab === 'employer' && <label className={`${labelClass} sm:col-span-2`}>Additional Notes <span className="font-normal text-slate-400">(optional)</span><textarea name="notes" rows={3} maxLength={2000} placeholder="Team size, budget range, must-have skills…" className={`${inputClass} resize-y`} /></label>}
      </fieldset>
      <div className="sm:col-span-2"><FileDrop label={config.fileLabel} accept={config.accept} extensions={config.extensions} file={file} onFile={setFile} disabled={submitting} /></div>
      <button type="submit" disabled={submitting} className="group sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-4 text-sm font-bold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70">{submitting ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : <>{config.submitLabel} <ArrowRight className="size-4 transition group-hover:translate-x-1" /></>}</button>
    </form>}
  </div></div></div>
}
