import { cookies } from 'next/headers'
import { checkPassword, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'
import { fail, ok } from '@/lib/http'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let password = ''
  try {
    const body: unknown = await request.json()
    if (body && typeof body === 'object' && 'password' in body && typeof body.password === 'string') {
      password = body.password
    }
  } catch {
    return fail('Invalid request.')
  }

  try {
    if (!password || !checkPassword(password)) {
      // Small fixed delay slows down password guessing.
      await new Promise((resolve) => setTimeout(resolve, 600))
      return fail('Incorrect password.', 401)
    }
    const store = await cookies()
    store.set(SESSION_COOKIE, createSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
    return ok('Signed in.')
  } catch (error) {
    console.error('[admin-login]', error)
    return fail('Admin access is not configured on the server.', 500)
  }
}

export async function DELETE() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  return ok('Signed out.')
}
