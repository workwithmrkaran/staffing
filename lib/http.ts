import 'server-only'
import { NextResponse } from 'next/server'
import type { ApiResult } from './types'

export function ok(message: string, extra?: Record<string, unknown>) {
  return NextResponse.json<ApiResult>({ success: true, message, ...extra })
}

export function fail(message: string, status = 400) {
  return NextResponse.json<ApiResult>({ success: false, message }, { status })
}

/** Reads multipart form data, rejecting non-multipart and oversize requests early. */
export async function readMultipart(request: Request): Promise<FormData | null> {
  const type = request.headers.get('content-type') ?? ''
  if (!type.includes('multipart/form-data')) return null
  const length = Number(request.headers.get('content-length') ?? 0)
  // 10MB file + a little room for text fields.
  if (length > 11 * 1024 * 1024) return null
  try {
    return await request.formData()
  } catch {
    return null
  }
}

/** Hidden "website" field: humans leave it empty, naive bots fill it in. */
export function isBot(form: FormData): boolean {
  const trap = form.get('website')
  return typeof trap === 'string' && trap.trim().length > 0
}
