import { withTransaction } from '@/lib/db'
import { fail, isBot, ok, readMultipart } from '@/lib/http'
import { insertFile, UploadError, validateFile } from '@/lib/uploads'
import { employerSchema, firstIssue, formDataToObject } from '@/lib/validation'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const form = await readMultipart(request)
  if (!form) return fail('Invalid submission. Please use the form and keep files under 10MB.')
  if (isBot(form)) return ok('Thank you. Our team will be in touch shortly.')

  const parsed = employerSchema.safeParse(formDataToObject(form))
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const d = parsed.data

  try {
    const upload = form.get('jd_file')
    const file = upload instanceof File && upload.size > 0 ? await validateFile(upload, ['pdf', 'docx']) : null

    // File and record are saved together: either both are stored or neither is.
    await withTransaction(async (client) => {
      const fileId = file ? await insertFile(client, file) : null
      await client.query(
        `insert into employer_requirements
           (company_name, contact_person, email, phone, role_title, sector, target_location, urgency, notes, jd_file_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [d.company_name, d.contact_person, d.email, d.phone, d.role_title, d.sector, d.target_location, d.urgency, d.notes, fileId],
      )
    })

    return ok('Thank you. Your hiring requirement has been received — our team will contact you shortly.')
  } catch (error) {
    if (error instanceof UploadError) return fail(error.message)
    console.error('[submit-employer]', error)
    return fail('Something went wrong while saving your request. Please try again or contact us directly.', 500)
  }
}
