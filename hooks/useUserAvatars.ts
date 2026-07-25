'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useUserAvatars(myId: string, partnerId: string) {
  const [myAvatarIdle, setMyAvatarIdle] = useState<string | null>(null)
  const [partnerAvatarIdle, setPartnerAvatarIdle] = useState<string | null>(null)

  useEffect(() => {
    if (!myId || !partnerId) return

    supabase
      .from('users')
      .select('id, avatar_idle')
      .in('id', [myId, partnerId])
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch avatars:', error)
          return
        }
        data?.forEach((row) => {
          if (row.id === myId) setMyAvatarIdle(row.avatar_idle)
          if (row.id === partnerId) setPartnerAvatarIdle(row.avatar_idle)
        })
      })

    // Live-update if either of you changes your avatar mid-session
    const channel = supabase
      .channel('user_avatar_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        (payload) => {
          const row = payload.new as { id: string; avatar_idle: string | null }
          if (row.id === myId) setMyAvatarIdle(row.avatar_idle)
          if (row.id === partnerId) setPartnerAvatarIdle(row.avatar_idle)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [myId, partnerId])

  return { myAvatarIdle, partnerAvatarIdle }
}