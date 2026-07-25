'use client'
import { supabase } from '@/lib/supabase'

const TOGETHER_WINDOW_MS = 5 * 60 * 1000 // 5 min window for "together" taps to count as simultaneous

export async function tapReveal(
  pin: { id: string; unlock_mode: 'solo' | 'together' },
  userId: string,
  partnerId: string
) {
  if (pin.unlock_mode === 'solo') {
    const { error } = await supabase
      .from('pins')
      .update({ status: 'revealed', revealed_at: new Date().toISOString() })
      .eq('id', pin.id)
    if (error) console.error('Reveal failed:', error)
    return
  }

  // together pins: record this user's tap
  const { error: presenceError } = await supabase
    .from('pin_presence')
    .upsert({
      pin_id: pin.id,
      user_id: userId,
      reveal_tapped: true,
      entered_at: new Date().toISOString(),
    })
  if (presenceError) {
    console.error('Presence upsert failed:', presenceError)
    return
  }

  // check if partner already tapped, and recently enough
  const { data: partnerPresence, error: fetchError } = await supabase
    .from('pin_presence')
    .select('reveal_tapped, entered_at')
    .eq('pin_id', pin.id)
    .eq('user_id', partnerId)
    .maybeSingle()

  if (fetchError) {
    console.error('Partner presence fetch failed:', fetchError)
    return
  }

  const partnerTappedRecently =
    partnerPresence?.reveal_tapped &&
    Date.now() - new Date(partnerPresence.entered_at).getTime() < TOGETHER_WINDOW_MS

  if (partnerTappedRecently) {
    // both tapped within the window — reveal for real
    await supabase
      .from('pins')
      .update({ status: 'revealed', revealed_at: new Date().toISOString() })
      .eq('id', pin.id)
    await supabase.from('pin_presence').delete().eq('pin_id', pin.id)
  } else {
    // first tap — mark as waiting
    await supabase.from('pins').update({ status: 'awaiting_partner' }).eq('id', pin.id)
  }
}