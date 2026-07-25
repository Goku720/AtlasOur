import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { USERS } from '@/lib/constants'

const VALID_STATES = ['idle', 'inrange', 'celebrate']

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const userId = formData.get('userId') as string | null
  const state = formData.get('state') as string | null

  if (!file || !userId || !state) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (!Object.values(USERS).includes(userId as any)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 403 })
  }
  if (!VALID_STATES.includes(state)) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const path = `avatars/${userId}-${state}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from('assets')
    .upload(path, buffer, { upsert: true, contentType: file.type })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from('assets').getPublicUrl(path)
  const column = `avatar_${state}`
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ [column]: urlData.publicUrl })
    .eq('id', userId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ url: urlData.publicUrl })
}