'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isWithinRadius } from '@/lib/geo'

export type Pin = {
  id: string
  created_by: string
  lat: number
  lng: number
  radius_m: number
  title: string
  note: string | null
  photo_url: string | null
  pin_type: 'bucket_list' | 'capsule'
  unlock_mode: 'solo' | 'together'
  status: string
}

export function usePinProximity(myLat: number | null, myLng: number | null) {
  const [pins, setPins] = useState<Pin[]>([])
  const [nearbyPinIds, setNearbyPinIds] = useState<Set<string>>(new Set())

  const refetchPins = () => {
    supabase
      .from('pins')
      .select('id, created_by, lat, lng, radius_m, title, note, photo_url, pin_type, unlock_mode, status')
      .then(({ data, error }) => {
        if (error) console.error('Failed to fetch pins:', error)
        else setPins(data || [])
      })
  }

  useEffect(() => {
    refetchPins()

    const channel = supabase
      .channel('pins_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pins' }, () => {
        refetchPins()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (myLat === null || myLng === null || pins.length === 0) {
      setNearbyPinIds(new Set())
      return
    }
    const nearby = new Set<string>()
    for (const pin of pins) {
      if (pin.status !== 'revealed' && isWithinRadius(myLat, myLng, pin.lat, pin.lng, pin.radius_m)) {
        nearby.add(pin.id)
      }
    }
    setNearbyPinIds(nearby)
  }, [myLat, myLng, pins])

  return { pins, nearbyPinIds, refetchPins }
}