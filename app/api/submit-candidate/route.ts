import { withTransaction } from '@/lib/db'
import { fail, hasConsent, isBot, ok, readMultipart } from '@/lib/http'
import { insertFile, UploadError, validateFile } from '@/lib/uploads'
import { candidateSchema, firstIssue, formDataToObject } from '@/lib/validation'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const form = await readMultipart(request)
  if (!form) return fail('Invalid submission. Please use the form and keep files under 10MB.')
  if (isBot(form)) return ok('Thank you. Your profile has been received.')
  if (!hasConsent(form)) return fail('Please accept the privacy consent to continue.')

  const parsed = candidateSchema.safeParse(formDataToObject(form))
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const d = parsed.data

  const upload = form.get('resume_file')
  if (!(upload instanceof File) || upload.size === 0) return fail('Please attach your resume (PDF).')

  try {
    const file = await validateFile(upload, ['pdf'])

    // File and record are saved together: either both are stored or neither is.
    await withTransaction(async (client) => {
      const fileId = await insertFile(client, file)
      await client.query(
        `insert into candidate_applications
           (full_name, email, phone, target_role, experience_years, notice_period,
            relocation_preference, passport_status, linkedin_url, resume_file_id,
            current_ctc_lpa, expected_ctc_lpa)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [d.full_name, d.email, d.phone, d.target_role, d.experience_years, d.notice_period,
          d.relocation_preference, d.passport_status, d.linkedin_url, fileId,
          d.current_ctc_lpa, d.expected_ctc_lpa],
      )
    })

    return ok('Thank you. Your profile is now in our talent network — we will reach out when a matching role opens.')
  } catch (error) {
    if (error instanceof UploadError) return fail(error.message)
    console.error('[submit-candidate]', error)
    return fail('Something went wrong while saving your application. Please try again or contact us directly.', 500)
  }
}
