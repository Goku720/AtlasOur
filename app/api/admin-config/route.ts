import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isAdminRequest } from '@/lib/verifyAdmin'

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const updates = await req.json()

  const { data, error } = await supabaseAdmin
    .from('app_config')
    .update(updates)
    .eq('id', 1)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}