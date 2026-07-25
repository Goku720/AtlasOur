import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { USERS } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const { pinId, userId } = await req.json()

  if (!pinId || !userId || !Object.values(USERS).includes(userId)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: pin, error: fetchError } = await supabaseAdmin
    .from('pins')
    .select('created_by')
    .eq('id', pinId)
    .single()

  if (fetchError || !pin) {
    return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
  }

  if (pin.created_by !== userId) {
    return NextResponse.json({ error: 'You can only remove pins you created' }, { status: 403 })
  }

  const { error: deleteError } = await supabaseAdmin.from('pins').delete().eq('id', pinId)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}