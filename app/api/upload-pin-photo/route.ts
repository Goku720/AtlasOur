import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { USERS } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const userId = formData.get('userId') as string | null

  if (!file || !userId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (!Object.values(USERS).includes(userId as any)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 403 })
  }

  const ext = file.name.split('.').pop()
  const path = `pin-content/${userId}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from('assets')
    .upload(path, buffer, { upsert: true, contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from('assets').getPublicUrl(path)
  return NextResponse.json({ url: urlData.publicUrl })
}