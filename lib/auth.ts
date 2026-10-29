import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'a3a_admin_session'
export const SESSION_MAX_AGE = 60 * 60 * 12 // 12 hours

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET
  if (!value || value.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be set to a random string of at least 32 characters.')
  }
  return value
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  // Hash both sides first so the comparison is constant-time regardless of length.
  const ha = createHmac('sha256', 'cmp').update(a).digest()
  const hb = createHmac('sha256', 'cmp').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) throw new Error('ADMIN_PASSWORD is not set.')
  return safeEqual(input, expected)
}

/** Token format: "<expiresAtMs>.<hmac>" */
export function createSessionToken(): string {
  const expires = String(Date.now() + SESSION_MAX_AGE * 1000)
  return `${expires}.${sign(expires)}`
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false
  const [expires, signature] = token.split('.')
  if (!expires || !signature) return false
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false
  return safeEqual(signature, sign(expires))
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  try {
    return verifySessionToken(store.get(SESSION_COOKIE)?.value)
  } catch (error) {
    console.error('[auth]', error)
    return false
  }
}
