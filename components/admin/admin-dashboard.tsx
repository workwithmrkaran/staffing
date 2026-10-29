'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Briefcase, Building2, ClipboardList, Download, ExternalLink, Eye, FileText, Inbox, Link2,
  Loader2, LogOut, Mail, MessageCircle, Phone, RefreshCw, Search, Star, Users, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { downloadCsv, toCsv } from '@/lib/csv'
import {
  CANDIDATE_STATUSES, EMPLOYER_STATUSES, EXPERIENCE_OPTIONS, SECTORS,
  type ApiResult, type CandidateApplication, type CandidateStatus, type EmployerRequirement,
  type EmployerStatus, type RecordKind,
} from '@/lib/types'

// ───────────────────────── helpers ─────────────────────────

type Selected =
  | { kind: 'candidate'; record: CandidateApplication }
  | { kind: 'employer'; record: EmployerRequirement }

interface RecordsResponse extends ApiResult {
  candidates?: CandidateApplication[]
  employers?: EmployerRequirement[]
}

interface UpdateResponse extends ApiResult {
  record?: CandidateApplication | EmployerRequirement
}

const STATUS_STYLES: Record<CandidateStatus | EmployerStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Reviewed: 'bg-sky-50 text-sky-700 ring-sky-200',
  Shortlisted: 'bg-navy-50 text-navy-700 ring-navy-200',
  Interviewing: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Rejected: 'bg-slate-100 text-slate-500 ring-slate-200',
  New: 'bg-brand-50 text-brand-700 ring-brand-200',
  Contacted: 'bg-sky-50 text-sky-700 ring-sky-200',
  'In Progress': 'bg-navy-50 text-navy-700 ring-navy-200',
  Filled: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Archived: 'bg-slate-100 text-slate-500 ring-slate-200',
}

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function fileHref(kind: RecordKind, id: string): string {
  return `/api/admin/file?kind=${kind}&id=${id}`
}

function whatsappHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`
}

function parseNotes(raw: string | null): { at: string | null; text: string }[] {
  if (!raw) return []
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const match = /^\[(.+?)\]\s(.*)$/.exec(line)
      return match ? { at: match[1], text: match[2] } : { at: null, text: line }
    })
    .reverse()
}

const CANDIDATE_CSV: { key: keyof CandidateApplication & string; header: string }[] = [
  { key: 'created_at', header: 'Submitted At' }, { key: 'full_name', header: 'Full Name' },
  { key: 'email', header: 'Email' }, { key: 'phone', header: 'Phone' },
  { key: 'target_role', header: 'Target Role' }, { key: 'experience_years', header: 'Experience' },
  { key: 'notice_period', header: 'Notice Period' }, { key: 'relocation_preference', header: 'Relocation' },
  { key: 'passport_status', header: 'Passport' }, { key: 'linkedin_url', header: 'LinkedIn' },
  { key: 'status', header: 'Status' }, { key: 'admin_notes', header: 'Admin Notes' }, { key: 'id', header: 'ID' },
]

const EMPLOYER_CSV: { key: keyof EmployerRequirement & string; header: string }[] = [
  { key: 'created_at', header: 'Submitted At' }, { key: 'company_name', header: 'Company' },
  { key: 'contact_person', header: 'Contact Person' }, { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' }, { key: 'role_title', header: 'Role Title' },
  { key: 'sector', header: 'Sector' }, { key: 'target_location', header: 'Location' },
  { key: 'urgency', header: 'Urgency' }, { key: 'notes', header: 'Employer Notes' },
  { key: 'status', header: 'Status' }, { key: 'admin_notes', header: 'Admin Notes' }, { key: 'id', header: 'ID' },
]

// ───────────────────────── small UI pieces ─────────────────────────

function StatusSelect<S extends string>({ value, options, onChange, disabled }: {
  value: S
  options: readonly S[]
  onChange: (next: S) => void
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      aria-label="Change status"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as S)}
      className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-bold ring-1 outline-none transition focus:ring-2 focus:ring-navy-400 disabled:opacity-60 ${STATUS_STYLES[value as CandidateStatus | EmployerStatus] ?? ''}`}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

/** A record's attached file (resume or JD), as needed by the open-file dialogs. */
interface FileTarget {
  kind: RecordKind
  id: string
  /** e.g. "Resume" or "Job description" */
  label: string
  /** Who it belongs to, shown in the dialog title */
  owner: string
  name: string | null
  mime: string | null
}

function fileTargetOf(kind: RecordKind, record: CandidateApplication | EmployerRequirement): FileTarget {
  return {
    kind,
    id: record.id,
    label: kind === 'candidate' ? 'Resume' : 'Job description',
    owner: 'full_name' in record ? record.full_name : record.company_name,
    name: record.file_name ?? null,
    mime: record.file_mime ?? null,
  }
}

const isPdf = (t: FileTarget) => t.mime === 'application/pdf' || (!t.mime && (t.name ?? '').toLowerCase().endsWith('.pdf'))

function FileButton({ target, label, onOpen }: { target: FileTarget; label: string; onOpen: (t: FileTarget) => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onOpen(target) }}
      className="inline-flex items-center gap-1.5 rounded-full bg-[#061b3d] px-2.5 py-1 text-xs font-bold text-white transition hover:bg-navy-700"
    >
      <FileText className="size-3.5" /> {label}
    </button>
  )
}

/** Closes on Escape without also closing whatever is underneath (e.g. the detail drawer). */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
}

/** "View here / Open in new tab / Download" choice shown when an admin clicks a file. */
function FileChoiceDialog({ target, onClose, onViewHere }: { target: FileTarget; onClose: () => void; onViewHere: () => void }) {
  useEscape(onClose)
  const pdf = isPdf(target)
  const href = fileHref(target.kind, target.id)
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#061b3d]/50 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Open ${target.label.toLowerCase()}`}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[1.5rem] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><FileText className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">{target.label}</p>
            <h3 className="mt-0.5 truncate text-lg font-bold text-[#061b3d]">{target.owner}</h3>
            {target.name && <p className="truncate text-xs text-slate-500">{target.name}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X className="size-4" /></button>
        </div>
        <p className="mt-5 text-sm font-semibold text-[#061b3d]">How would you like to open it?</p>
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={onViewHere}
            disabled={!pdf}
            className="flex items-center gap-3 rounded-xl bg-[#061b3d] px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <Eye className="size-4" />
            <span className="flex-1">View here<span className="block text-xs font-normal opacity-80">{pdf ? 'Opens inside this page' : 'Preview is only available for PDF files'}</span></span>
          </button>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-[#061b3d] transition hover:border-navy-400 hover:bg-navy-50"
          >
            <ExternalLink className="size-4" />
            <span className="flex-1">Open in new tab<span className="block text-xs font-normal text-slate-500">{pdf ? 'Opens in a separate browser tab' : 'Word files download to your computer'}</span></span>
          </a>
          <a
            href={`${href}&download=1`}
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-[#061b3d] transition hover:border-navy-400 hover:bg-navy-50"
          >
            <Download className="size-4" />
            <span className="flex-1">Download<span className="block text-xs font-normal text-slate-500">Save a copy to your computer</span></span>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

/** Full-screen in-page PDF viewer. */
function FileViewer({ target, onClose }: { target: FileTarget; onClose: () => void }) {
  useEscape(onClose)
  const [loading, setLoading] = useState(true)
  const href = fileHref(target.kind, target.id)
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#061b3d]/80 p-2 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${target.label} – ${target.owner}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex size-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center gap-3 border-b border-slate-200 bg-[#061b3d] px-4 py-3 text-white sm:px-5">
          <FileText className="size-5 shrink-0 text-brand-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{target.owner} · {target.label}</p>
            {target.name && <p className="truncate text-xs text-slate-300">{target.name}</p>}
          </div>
          <a href={href} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 sm:inline-flex"><ExternalLink className="size-3.5" /> New tab</a>
          <a href={`${href}&download=1`} className="hidden items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 sm:inline-flex"><Download className="size-3.5" /> Download</a>
          <button type="button" onClick={onClose} aria-label="Close viewer" className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"><X className="size-5" /></button>
        </header>
        <div className="relative flex-1 bg-slate-100">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center gap-3 text-sm font-semibold text-slate-500">
              <Loader2 className="size-5 animate-spin text-navy-600" /> Loading document…
            </div>
          )}
          <iframe src={`${href}#view=FitH`} title={`${target.label} – ${target.owner}`} onLoad={() => setLoading(false)} className="relative size-full border-0" />
        </div>
      </motion.div>
    </div>
  )
}

function KpiCard({ label, value, hint, icon, accent }: { label: string; value: number; hint: string; icon: ReactNode; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-[-.03em] text-[#061b3d] tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: readonly string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#061b3d] outline-none focus:border-navy-500"
    >
      <option value="">{label}: All</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

function DataTable<T extends { id: string }>({ rows, columns, onRowClick, empty }: {
  rows: T[]
  columns: Column<T>[]
  onRowClick: (row: T) => void
  empty: string
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <Inbox className="size-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-500">{empty}</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-[.12em] text-slate-500">
          <tr>{columns.map((c) => <th key={c.header} scope="col" className={`px-4 py-3 ${c.className ?? ''}`}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={row.id}
              tabIndex={0}
              onClick={() => onRowClick(row)}
              onKeyDown={(e) => { if (e.key === 'Enter') onRowClick(row) }}
              className="cursor-pointer transition hover:bg-navy-50/40 focus:bg-navy-50/60 focus:outline-none"
            >
              {columns.map((c) => <td key={c.header} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>{c.cell(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ───────────────────────── detail drawer ─────────────────────────

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2.5 text-sm">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-[#061b3d]">{children || <span className="text-slate-400">—</span>}</dd>
    </div>
  )
}

function DetailDrawer({ selected, onClose, onUpdate, onOpenFile }: {
  selected: Selected
  onClose: () => void
  onUpdate: (kind: RecordKind, id: string, patch: { status?: string; note?: string }) => Promise<boolean>
  onOpenFile: (t: FileTarget) => void
}) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const { kind, record } = selected
  const notes = parseNotes(record.admin_notes)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const addNote = async () => {
    if (!note.trim()) return
    setSaving(true)
    const done = await onUpdate(kind, record.id, { note: note.trim() })
    setSaving(false)
    if (done) setNote('')
  }

  const title = kind === 'candidate' ? selected.record.full_name : selected.record.company_name
  const subtitle = kind === 'candidate' ? selected.record.target_role : `${selected.record.role_title} · ${selected.record.contact_person}`
  const hasFile = kind === 'candidate' ? Boolean(selected.record.resume_file_id) : Boolean(selected.record.jd_file_id)

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-[#061b3d]/40 backdrop-blur-[2px]" />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`${title} details`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#061b3d] px-6 py-5 text-white">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-400">{kind === 'candidate' ? 'Candidate' : 'Employer requirement'}</p>
            <h2 className="mt-1 truncate text-xl font-bold">{title}</h2>
            <p className="truncate text-sm text-slate-300">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"><X className="size-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            {kind === 'candidate'
              ? <StatusSelect value={selected.record.status} options={CANDIDATE_STATUSES} onChange={(s) => void onUpdate(kind, record.id, { status: s })} />
              : <StatusSelect value={selected.record.status} options={EMPLOYER_STATUSES} onChange={(s) => void onUpdate(kind, record.id, { status: s })} />}
            {hasFile && <FileButton target={fileTargetOf(kind, record)} label={kind === 'candidate' ? 'Open resume' : 'Open JD'} onOpen={onOpenFile} />}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            <a href={`mailto:${record.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[#061b3d] hover:border-navy-400"><Mail className="size-3.5 text-navy-600" /> Email</a>
            <a href={`tel:${record.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[#061b3d] hover:border-navy-400"><Phone className="size-3.5 text-navy-600" /> Call</a>
            <a href={whatsappHref(record.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[#061b3d] hover:border-emerald-400"><MessageCircle className="size-3.5 text-emerald-600" /> WhatsApp</a>
            {kind === 'candidate' && selected.record.linkedin_url && (
              <a href={selected.record.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[#061b3d] hover:border-sky-400"><Link2 className="size-3.5 text-sky-600" /> LinkedIn</a>
            )}
          </div>

          <dl className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
            <DetailRow label="Submitted">{dateTimeFormat.format(new Date(record.created_at))}</DetailRow>
            <DetailRow label="Email">{record.email}</DetailRow>
            <DetailRow label="Phone">{record.phone}</DetailRow>
            {kind === 'candidate' ? (
              <>
                <DetailRow label="Target role">{selected.record.target_role}</DetailRow>
                <DetailRow label="Experience">{selected.record.experience_years}</DetailRow>
                <DetailRow label="Notice period">{selected.record.notice_period}</DetailRow>
                <DetailRow label="Relocation">{selected.record.relocation_preference}</DetailRow>
                <DetailRow label="Passport">{selected.record.passport_status}</DetailRow>
                <DetailRow label="LinkedIn">{selected.record.linkedin_url}</DetailRow>
              </>
            ) : (
              <>
                <DetailRow label="Contact person">{selected.record.contact_person}</DetailRow>
                <DetailRow label="Role title">{selected.record.role_title}</DetailRow>
                <DetailRow label="Sector">{selected.record.sector}</DetailRow>
                <DetailRow label="Location">{selected.record.target_location}</DetailRow>
                <DetailRow label="Urgency">{selected.record.urgency}</DetailRow>
                <DetailRow label="Employer notes"><span className="whitespace-pre-wrap">{selected.record.notes}</span></DetailRow>
              </>
            )}
          </dl>

          <section className="mt-6">
            <h3 className="text-sm font-bold text-[#061b3d]">Internal notes</h3>
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void addNote() }}
                rows={3}
                maxLength={2000}
                placeholder="Add a note (Ctrl+Enter to save)…"
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-4 focus:ring-navy-100"
              />
              <button type="button" onClick={() => void addNote()} disabled={saving || !note.trim()} className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50">
                {saving && <Loader2 className="size-4 animate-spin" />} Add note
              </button>
            </div>
            {notes.length === 0
              ? <p className="mt-4 text-sm text-slate-400">No notes yet.</p>
              : (
                <ol className="mt-4 flex flex-col gap-3">
                  {notes.map((n, i) => (
                    <li key={`${n.at ?? 'legacy'}-${i}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      {n.at && <p className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-400">{Number.isNaN(Date.parse(n.at)) ? n.at : dateTimeFormat.format(new Date(n.at))}</p>}
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-[#061b3d]">{n.text}</p>
                    </li>
                  ))}
                </ol>
              )}
          </section>
        </div>
      </motion.aside>
    </>
  )
}

// ───────────────────────── dashboard ─────────────────────────

export function AdminDashboard() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateApplication[]>([])
  const [employers, setEmployers] = useState<EmployerRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<RecordKind>('candidate')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [secondaryFilter, setSecondaryFilter] = useState('')
  const [selectedRef, setSelectedRef] = useState<{ kind: RecordKind; id: string } | null>(null)
  const [fileChoice, setFileChoice] = useState<FileTarget | null>(null)
  const [fileViewer, setFileViewer] = useState<FileTarget | null>(null)
  const closeFileChoice = useCallback(() => setFileChoice(null), [])
  const closeFileViewer = useCallback(() => setFileViewer(null), [])

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    try {
      const response = await fetch('/api/admin/records', { cache: 'no-store' })
      if (response.status === 401) { router.refresh(); return }
      const result = (await response.json().catch(() => null)) as RecordsResponse | null
      if (!response.ok || !result?.success) throw new Error(result?.message ?? 'Could not load records.')
      setCandidates(result.candidates ?? [])
      setEmployers(result.employers ?? [])
      setLoadError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load records.'
      setLoadError(message)
      if (silent) toast.error(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    void load()
    const onFocus = () => { void load(true) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const replaceRecord = useCallback((kind: RecordKind, record: CandidateApplication | EmployerRequirement) => {
    if (kind === 'candidate') setCandidates((rows) => rows.map((r) => (r.id === record.id ? { ...r, ...(record as CandidateApplication) } : r)))
    else setEmployers((rows) => rows.map((r) => (r.id === record.id ? { ...r, ...(record as EmployerRequirement) } : r)))
  }, [])

  const updateRecord = useCallback(async (kind: RecordKind, id: string, patch: { status?: string; note?: string }): Promise<boolean> => {
    // Optimistic status change; rolled back if the server rejects it.
    const previous = kind === 'candidate' ? candidates.find((r) => r.id === id) : employers.find((r) => r.id === id)
    if (previous && patch.status) replaceRecord(kind, { ...previous, status: patch.status } as CandidateApplication | EmployerRequirement)
    try {
      const response = await fetch('/api/admin/records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, id, ...patch }),
      })
      if (response.status === 401) { router.refresh(); return false }
      const result = (await response.json().catch(() => null)) as UpdateResponse | null
      if (!response.ok || !result?.success || !result.record) throw new Error(result?.message ?? 'Update failed.')
      replaceRecord(kind, result.record)
      toast.success(patch.note ? 'Note added' : `Status set to ${patch.status}`)
      return true
    } catch (error) {
      if (previous) replaceRecord(kind, previous)
      toast.error(error instanceof Error ? error.message : 'Update failed.')
      return false
    }
  }, [candidates, employers, replaceRecord, router])

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' }).catch(() => null)
    router.refresh()
  }

  const switchTab = (next: RecordKind) => {
    setTab(next)
    setStatusFilter('')
    setSecondaryFilter('')
  }

  const q = query.trim().toLowerCase()
  const filteredCandidates = useMemo(() => candidates.filter((c) =>
    (!statusFilter || c.status === statusFilter) &&
    (!secondaryFilter || c.experience_years === secondaryFilter) &&
    (!q || [c.full_name, c.email, c.phone, c.target_role].some((v) => v.toLowerCase().includes(q))),
  ), [candidates, statusFilter, secondaryFilter, q])

  const filteredEmployers = useMemo(() => employers.filter((e) =>
    (!statusFilter || e.status === statusFilter) &&
    (!secondaryFilter || e.sector === secondaryFilter) &&
    (!q || [e.company_name, e.contact_person, e.email, e.phone, e.role_title, e.target_location].some((v) => v.toLowerCase().includes(q))),
  ), [employers, statusFilter, secondaryFilter, q])

  const kpis = useMemo(() => ({
    totalApplications: candidates.length,
    activeRequirements: employers.filter((e) => e.status !== 'Filled' && e.status !== 'Archived').length,
    pendingReviews: candidates.filter((c) => c.status === 'Pending').length + employers.filter((e) => e.status === 'New').length,
    shortlistedPlaced: candidates.filter((c) => c.status === 'Shortlisted' || c.status === 'Interviewing').length + employers.filter((e) => e.status === 'Filled').length,
  }), [candidates, employers])

  const selected: Selected | null = useMemo(() => {
    if (!selectedRef) return null
    if (selectedRef.kind === 'candidate') {
      const record = candidates.find((c) => c.id === selectedRef.id)
      return record ? { kind: 'candidate', record } : null
    }
    const record = employers.find((e) => e.id === selectedRef.id)
    return record ? { kind: 'employer', record } : null
  }, [selectedRef, candidates, employers])

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    if (tab === 'candidate') downloadCsv(`a3a-candidates-${stamp}.csv`, toCsv(candidates, CANDIDATE_CSV))
    else downloadCsv(`a3a-employer-requirements-${stamp}.csv`, toCsv(employers, EMPLOYER_CSV))
    toast.success(`Exported ${tab === 'candidate' ? candidates.length : employers.length} records`)
  }

  const closeDrawer = useCallback(() => setSelectedRef(null), [])

  const candidateColumns: Column<CandidateApplication>[] = [
    { header: 'Candidate', cell: (c) => <div><p className="font-semibold text-[#061b3d]">{c.full_name}</p><p className="text-xs text-slate-500">{c.email}</p></div> },
    { header: 'Target role', cell: (c) => <span className="text-slate-700">{c.target_role}</span> },
    { header: 'Experience', cell: (c) => c.experience_years, className: 'whitespace-nowrap' },
    { header: 'Notice', cell: (c) => c.notice_period, className: 'whitespace-nowrap' },
    { header: 'Resume', cell: (c) => <FileButton target={fileTargetOf('candidate', c)} label="Resume" onOpen={setFileChoice} /> },
    { header: 'Status', cell: (c) => <StatusSelect value={c.status} options={CANDIDATE_STATUSES} onChange={(s) => void updateRecord('candidate', c.id, { status: s })} /> },
    { header: 'Submitted', cell: (c) => dateFormat.format(new Date(c.created_at)), className: 'whitespace-nowrap text-slate-500' },
  ]

  const employerColumns: Column<EmployerRequirement>[] = [
    { header: 'Company', cell: (e) => <div><p className="font-semibold text-[#061b3d]">{e.company_name}</p><p className="text-xs text-slate-500">{e.contact_person} · {e.email}</p></div> },
    { header: 'Role', cell: (e) => <div><p className="text-slate-700">{e.role_title}</p><p className="text-xs text-slate-500">{e.target_location}</p></div> },
    { header: 'Sector', cell: (e) => e.sector, className: 'whitespace-nowrap' },
    { header: 'Urgency', cell: (e) => <span className={e.urgency === 'Immediate' ? 'font-semibold text-brand-600' : ''}>{e.urgency}</span>, className: 'whitespace-nowrap' },
    { header: 'JD', cell: (e) => (e.jd_file_id ? <FileButton target={fileTargetOf('employer', e)} label="JD" onOpen={setFileChoice} /> : <span className="text-xs text-slate-400">None</span>) },
    { header: 'Status', cell: (e) => <StatusSelect value={e.status} options={EMPLOYER_STATUSES} onChange={(s) => void updateRecord('employer', e.id, { status: s })} /> },
    { header: 'Submitted', cell: (e) => dateFormat.format(new Date(e.created_at)), className: 'whitespace-nowrap text-slate-500' },
  ]

  const tabs: { id: RecordKind; label: string; count: number; icon: ReactNode }[] = [
    { id: 'candidate', label: 'Candidate Submissions', count: candidates.length, icon: <Users className="size-4" /> },
    { id: 'employer', label: 'Employer Requirements', count: employers.length, icon: <Building2 className="size-4" /> },
  ]

  return (
    <div className="min-h-screen bg-[#fffaf5] text-slate-600">
      <header className="sticky top-0 z-30 border-b-2 border-brand-400 bg-[#061b3d] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-400">A3A Staffing Solutions</p>
            <h1 className="text-lg font-bold tracking-[-.02em]">Operations Console</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-60">
              <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20">
              <LogOut className="size-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total applications" value={kpis.totalApplications} hint="Candidate profiles received" icon={<ClipboardList className="size-4" />} accent="bg-navy-50 text-navy-600" />
          <KpiCard label="Active requirements" value={kpis.activeRequirements} hint="Not filled or archived" icon={<Briefcase className="size-4" />} accent="bg-brand-50 text-brand-500" />
          <KpiCard label="Pending reviews" value={kpis.pendingReviews} hint="Pending candidates + new leads" icon={<Inbox className="size-4" />} accent="bg-amber-50 text-amber-600" />
          <KpiCard label="Shortlisted / placed" value={kpis.shortlistedPlaced} hint="Shortlisted, interviewing, filled" icon={<Star className="size-4" />} accent="bg-emerald-50 text-emerald-600" />
        </section>

        <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap rounded-xl bg-slate-100 p-1" role="tablist">
              {tabs.map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => switchTab(t.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${tab === t.id ? 'bg-white text-[#061b3d] shadow-sm' : 'text-slate-500 hover:text-[#061b3d]'}`}>
                  {t.icon} {t.label} <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs tabular-nums">{t.count}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <span className="sr-only">Search</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tab === 'candidate' ? 'Search name, email, phone or role…' : 'Search company, contact, email or role…'}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-navy-500 focus:ring-4 focus:ring-navy-100"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={tab === 'candidate' ? CANDIDATE_STATUSES : EMPLOYER_STATUSES} />
                {tab === 'candidate'
                  ? <FilterSelect label="Experience" value={secondaryFilter} onChange={setSecondaryFilter} options={EXPERIENCE_OPTIONS} />
                  : <FilterSelect label="Sector" value={secondaryFilter} onChange={setSecondaryFilter} options={SECTORS} />}
                <button type="button" onClick={exportCsv} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60">
                  <Download className="size-4" /> Export CSV
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-sm font-semibold text-slate-500">
              <Loader2 className="size-5 animate-spin text-navy-600" /> Loading records…
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <p className="text-sm font-semibold text-brand-600">{loadError}</p>
              <button type="button" onClick={() => { setLoading(true); void load() }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#061b3d] hover:border-navy-400">
                <RefreshCw className="size-4" /> Try again
              </button>
            </div>
          ) : tab === 'candidate' ? (
            <DataTable rows={filteredCandidates} columns={candidateColumns} onRowClick={(c) => setSelectedRef({ kind: 'candidate', id: c.id })} empty={candidates.length ? 'No candidates match these filters.' : 'No candidate applications yet.'} />
          ) : (
            <DataTable rows={filteredEmployers} columns={employerColumns} onRowClick={(e) => setSelectedRef({ kind: 'employer', id: e.id })} empty={employers.length ? 'No requirements match these filters.' : 'No employer requirements yet.'} />
          )}

          {!loading && !loadError && (
            <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
              Showing {tab === 'candidate' ? filteredCandidates.length : filteredEmployers.length} of {tab === 'candidate' ? candidates.length : employers.length}. Click a row for full details. <ExternalLink className="ml-1 inline size-3" /> Files open only for signed-in admins.
            </p>
          )}
        </section>
      </main>

      <AnimatePresence>
        {selected && <DetailDrawer key={`${selected.kind}-${selected.record.id}`} selected={selected} onClose={closeDrawer} onUpdate={updateRecord} onOpenFile={setFileChoice} />}
      </AnimatePresence>
      {fileChoice && (
        <FileChoiceDialog
          target={fileChoice}
          onClose={closeFileChoice}
          onViewHere={() => { setFileViewer(fileChoice); setFileChoice(null) }}
        />
      )}
      {fileViewer && <FileViewer target={fileViewer} onClose={closeFileViewer} />}
    </div>
  )
}
