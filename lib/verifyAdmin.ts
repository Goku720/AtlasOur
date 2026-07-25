import { cookies } from 'next/headers'

export async function isAdminRequest() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  return session === process.env.ADMIN_SESSION_SECRET
}