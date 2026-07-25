'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function usePartnerLocation(partnerId: string) {
  const [location, setLocation] = useState<{ lat: number; lng: number; sharing: boolean } | null>(null)

  useEffect(() => {
    supabase
      .from('live_location')
      .select('lat, lng, sharing')
      .eq('user_id', partnerId)
      .maybeSingle()  // ← changed from .single()
      .then(({ data, error }) => {
        if (error) console.error('Partner location fetch error:', error)
        if (data) setLocation(data)
      })

    const channel = supabase
      .channel('live_location_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_location', filter: `user_id=eq.${partnerId}` },
        (payload) => {
          const row = payload.new as any
          setLocation(row.sharing ? { lat: row.lat, lng: row.lng, sharing: true } : null)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [partnerId])

  return location
}