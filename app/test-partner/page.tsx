'use client'
import { useState } from 'react'
import { usePinProximity } from '@/hooks/usePinProximity'
import { tapReveal } from '@/hooks/usePinReveal'
import { USERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

export default function TestPartner() {
  const [lat, setLat] = useState('26.1445')
  const [lng, setLng] = useState('91.7362')
  const [applied, setApplied] = useState<{ lat: number; lng: number } | null>(null)

  const { pins, nearbyPinIds } = usePinProximity(applied?.lat ?? null, applied?.lng ?? null)

  const applyPosition = async () => {
    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)
    setApplied({ lat: parsedLat, lng: parsedLng })

    // Also write to live_location so it behaves like real sharing
    await supabase.from('live_location').upsert({
      user_id: USERS.Neha,
      lat: parsedLat,
      lng: parsedLng,
      sharing: true,
      updated_at: new Date().toISOString(),
    })
  }

  const clearPosition = async () => {
    setApplied(null)
    await supabase.from('live_location').upsert({
      user_id: USERS.Neha,
      lat: null,
      lng: null,
      sharing: false,
    })
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Partner test (manual position)</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          Lat: <input value={lat} onChange={(e) => setLat(e.target.value)} style={{ marginRight: 10 }} />
        </label>
        <label>
          Lng: <input value={lng} onChange={(e) => setLng(e.target.value)} style={{ marginRight: 10 }} />
        </label>
        <button onClick={applyPosition}>Set position</button>
        <button onClick={clearPosition} style={{ marginLeft: 10 }}>Clear</button>
      </div>

      <h2>Applied position (Neha)</h2>
      <pre>{JSON.stringify(applied, null, 2)}</pre>

      <h2>All pins ({pins.length})</h2>
      <ul>
        {pins.map((p) => {
          const inRange = nearbyPinIds.has(p.id)
          return (
            <li key={p.id} style={{ marginBottom: 12 }}>
              <strong>{p.title}</strong> — status: {p.status}, mode: {p.unlock_mode}
              {inRange && p.status !== 'revealed' && (
                <button
                  style={{ marginLeft: 10 }}
                  onClick={() => tapReveal(p, USERS.Neha, USERS.Samir)}
                >
                  Reveal
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}