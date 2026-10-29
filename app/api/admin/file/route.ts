import { isAdmin } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { fail } from '@/lib/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const QUERIES = {
  candidate: `select f.file_name, f.mime_type, f.data
                from candidate_applications r join uploaded_files f on f.id = r.resume_file_id
               where r.id = $1`,
  employer: `select f.file_name, f.mime_type, f.data
               from employer_requirements r join uploaded_files f on f.id = r.jd_file_id
              where r.id = $1`,
} as const

/**
 * GET /api/admin/file?kind=candidate|employer&id=<record uuid>
 * Streams the stored resume/JD to a signed-in admin. Files are never publicly reachable.
 * Add &download=1 to force a download instead of opening in the browser.
 */
export async function GET(request: Request) {
  if (!(await isAdmin())) return fail('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind')
  const id = searchParams.get('id') ?? ''
  if ((kind !== 'candidate' && kind !== 'employer') || !UUID.test(id)) return fail('Invalid file request.')

  try {
    const { rows } = await getPool().query<{ file_name: string; mime_type: string; data: Buffer }>(QUERIES[kind], [id])
    const file = rows[0]
    if (!file) return fail('No file attached to this record.', 404)

    // PDFs open in the browser (new tab or the admin viewer); DOCX files always download.
    const isPdf = file.mime_type === 'application/pdf'
    const disposition = isPdf && searchParams.get('download') !== '1' ? 'inline' : 'attachment'
    return new Response(new Uint8Array(file.data), {
      headers: {
        'Content-Type': file.mime_type,
        'Content-Length': String(file.data.length),
        'Content-Disposition': `${disposition}; filename="${file.file_name}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        // PDFs may only be framed by this site (Chrome's PDF viewer refuses to run under a CSP sandbox).
        // Anything else is fully sandboxed.
        'Content-Security-Policy': isPdf ? "frame-ancestors 'self'" : "default-src 'none'; sandbox",
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  } catch (error) {
    console.error('[admin-file]', error)
    return fail('Could not open the file.', 500)
  }
}
