import 'server-only'
import type { PoolClient } from 'pg'
import { MAX_UPLOAD_BYTES } from './types'

const PDF = 'application/pdf'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

type AllowedType = 'pdf' | 'docx'

const TYPES: Record<AllowedType, { mime: string; ext: string; magic: number[] }> = {
  pdf: { mime: PDF, ext: '.pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  docx: { mime: DOCX, ext: '.docx', magic: [0x50, 0x4b, 0x03, 0x04] }, // ZIP container
}

export class UploadError extends Error {}

export interface ValidatedFile {
  name: string
  mime: string
  bytes: Buffer
}

/**
 * Validates a file by extension, size and leading "magic" bytes
 * (the browser-supplied MIME type alone can be spoofed).
 */
export async function validateFile(file: File, allowed: AllowedType[]): Promise<ValidatedFile> {
  if (file.size === 0) throw new UploadError('The uploaded file is empty.')
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('File is too large. Maximum size is 10MB.')

  const lower = file.name.toLowerCase()
  const type = allowed.find((t) => lower.endsWith(TYPES[t].ext))
  if (!type) throw new UploadError(`Only ${allowed.map((t) => t.toUpperCase()).join(' or ')} files are accepted.`)

  const bytes = Buffer.from(await file.arrayBuffer())
  const { magic, mime, ext } = TYPES[type]
  if (!magic.every((b, i) => bytes[i] === b)) {
    throw new UploadError(`The file does not look like a valid ${type.toUpperCase()} document.`)
  }

  // Keep a readable, header-safe file name.
  const base = file.name.replace(/\.[^.]*$/, '').replace(/[^\w\- ]+/g, '').trim().slice(0, 80) || 'document'
  return { name: `${base}${ext}`, mime, bytes }
}

/** Stores a validated file and returns its id. Call inside the same transaction as the record insert. */
export async function insertFile(client: PoolClient, file: ValidatedFile): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    'insert into uploaded_files (file_name, mime_type, size_bytes, data) values ($1, $2, $3, $4) returning id',
    [file.name, file.mime, file.bytes.length, file.bytes],
  )
  return rows[0].id
}
