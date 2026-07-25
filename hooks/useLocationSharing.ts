'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useLocationSharing(userId: string) {
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null)
  const watchId = useRef<number | null>(null)


  const stopSharing = async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setSharing(false)
    setMyPosition(null)
    await supabase
      .from('live_location')
      .upsert({ user_id: userId, sharing: false, lat: null, lng: null })
  }

  const startSharing = () => {
  console.log('startSharing called')
  if (!navigator.geolocation) {
    setError('Geolocation not supported on this device')
    return
  }
  try {
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        console.log('Got position:', pos.coords.latitude, pos.coords.longitude)
        setError(null)
        setMyPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        const { error: upsertError } = await supabase.from('live_location').upsert({
          user_id: userId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          sharing: true,
          updated_at: new Date().toISOString(),
        })
        if (upsertError) {
          console.error('Supabase upsert failed:', upsertError)
          setError(`Save failed: ${upsertError.message}`)
        }
      },
      (err) => {
        console.error('Geolocation error:', err)
        setError(`Geolocation error: ${err.message} (code ${err.code})`)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
    )
    setSharing(true)
  } catch (e: any) {
    console.error('watchPosition threw synchronously:', e)
    setError(`Failed to start: ${e.message || e}`)
  }
}
  // Stop sharing automatically if tab is hidden or closed
// Stop sharing automatically if tab is hidden too long
useEffect(() => {
  let hideTimeout: ReturnType<typeof setTimeout> | null = null

  const handleVisibility = () => {
    if (document.hidden && sharing) {
      hideTimeout = setTimeout(() => {
        stopSharing()
      }, 30000)
    } else if (!document.hidden && hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
  }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (hideTimeout) clearTimeout(hideTimeout)
      // NOTE: watch cleanup removed from here — moved to a separate unmount-only effect below
    }
  }, [sharing])

  // Separate effect: only clears the GPS watch when the component actually unmounts
  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

    return { sharing, error, startSharing, stopSharing, myPosition }
}
