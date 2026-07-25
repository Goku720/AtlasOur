import { NextRequest, NextResponse } from 'next/server'
import { USERS } from '@/lib/constants'

// Map each known user ID to the env var holding their password.
// Passwords live server-side only — never exposed to the browser.
function getExpectedPassword(userId: string): string | null {
  if (userId === USERS.Samir) return process.env.SAMIR_PASSWORD ?? null
  if (userId === USERS.Neha) return process.env.NEHA_PASSWORD ?? null
  return null
}

export async function POST(req: NextRequest) {
  const { userId, password } = await req.json()

  if (!userId || !password || !Object.values(USERS).includes(userId)) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }

  const expected = getExpectedPassword(userId)
  if (!expected || password !== expected) {
    return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  // Lightweight session cookie — same pattern as admin login, scoped per user.
  res.cookies.set('user_session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}