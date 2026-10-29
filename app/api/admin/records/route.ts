import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { fail, ok } from '@/lib/http'
import type { CandidateApplication, EmployerRequirement } from '@/lib/types'
import { firstIssue, updateSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Fixed table names (never user input), safe to place in SQL text.
const TABLES = { candidate: 'candidate_applications', employer: 'employer_requirements' } as const

const CANDIDATE_COLUMNS = `id, created_at, full_name, email, phone, target_role, experience_years, notice_period,
  relocation_preference, passport_status, linkedin_url, resume_file_id, admin_notes, status`
const EMPLOYER_COLUMNS = `id, created_at, company_name, contact_person, email, phone, role_title, sector,
  target_location, urgency, jd_file_id, notes, admin_notes, status`

export async function GET() {
  if (!(await isAdmin())) return fail('Unauthorized', 401)
  try {
    const db = getPool()
    const [candidates, employers] = await Promise.all([
      db.query<CandidateApplication>(`select c.*, f.file_name, f.mime_type as file_mime from candidate_applications c left join uploaded_files f on f.id = c.resume_file_id order by c.created_at desc`),
      db.query<EmployerRequirement>(`select e.*, f.file_name, f.mime_type as file_mime from employer_requirements e left join uploaded_files f on f.id = e.jd_file_id order by e.created_at desc`),
    ])
    return NextResponse.json({ success: true, message: 'ok', candidates: candidates.rows, employers: employers.rows })
  } catch (error) {
    console.error('[admin-records:get]', error)
    return fail('Could not load records.', 500)
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return fail('Unauthorized', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Invalid request.')
  }
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const { kind, id, status, note } = parsed.data
  if (!status && !note) return fail('Nothing to update.')

  const entry = note ? `[${new Date().toISOString()}] ${note}` : null
  const columns = kind === 'candidate' ? CANDIDATE_COLUMNS : EMPLOYER_COLUMNS

  try {
    // Notes are an append-only, timestamped history; the append happens atomically in SQL.
    const { rows } = await getPool().query(
      `update ${TABLES[kind]}
          set status = coalesce($2, status),
              admin_notes = case
                when $3::text is null then admin_notes
                when admin_notes is null or admin_notes = '' then $3::text
                else admin_notes || E'\\n' || $3::text
              end
        where id = $1
        returning ${columns}`,
      [id, status ?? null, entry],
    )
    if (rows.length === 0) return fail('Record not found.', 404)
    return ok('Record updated.', { record: rows[0] })
  } catch (error) {
    console.error('[admin-records:patch]', error)
    return fail('Could not update the record.', 500)
  }
}
