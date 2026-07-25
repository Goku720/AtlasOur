import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isAdminRequest } from '@/lib/verifyAdmin'

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const path = formData.get('path') as string | null
  if (!file || !path) return NextResponse.json({ error: 'Missing file or path' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await supabaseAdmin.storage
    .from('assets')
    .upload(path, buffer, { upsert: true, contentType: file.type })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabaseAdmin.storage.from('assets').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}