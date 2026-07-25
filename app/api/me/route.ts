import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { USERS } from '@/lib/constants'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('user_session')?.value

  if (!session || !Object.values(USERS).includes(session as any)) {
    return NextResponse.json({ userId: null })
  }

  return NextResponse.json({ userId: session })
}