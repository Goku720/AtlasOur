'use client'
import { useState, useRef } from 'react'

type SearchResult = { id: string; name: string }

export function SearchBar({
  proximity,
  onSelect,
}: {
  proximity: { lat: number; lng: number } | null
  onSelect: (lat: number, lng: number, name: string) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionToken = useRef(crypto.randomUUID())

  const runSearch = async (text: string) => {
    if (!text.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const proximityParam = proximity ? `&proximity=${proximity.lng},${proximity.lat}` : ''
    const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(text)}&language=en&country=IN&limit=6&session_token=${sessionToken.current}&access_token=${token}${proximityParam}`
    try {
      const res = await fetch(url)
      const json = await res.json()
      setResults((json.suggestions || []).map((s: any) => ({
        id: s.mapbox_id,
        name: s.name + (s.place_formatted ? `, ${s.place_formatted}` : ''),
      })))
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (value: string) => {
    setQuery(value)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(value), 350)
  }

  const handleSelect = async (r: SearchResult) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${r.id}?session_token=${sessionToken.current}&access_token=${token}`
    const res = await fetch(url)
    const json = await res.json()
    const feature = json.features?.[0]
    if (!feature) return
    const [lng, lat] = feature.geometry.coordinates
    onSelect(lat, lng, r.name)
    setQuery(r.name)
    setOpen(false)
    sessionToken.current = crypto.randomUUID() // new billing session for next search
  }

  return (
    <div style={wrapper}>
      <div style={inputRow}>
        <span style={{ fontSize: 15 }}>🔍</span>
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search a place..."
          style={inputStyle}
        />
        {loading && <span style={{ fontSize: 11, color: '#aaa' }}>...</span>}
      </div>
      {open && results.length > 0 && (
        <div style={dropdown}>
          {results.map((r) => (
            <button key={r.id} style={resultRow} onClick={() => handleSelect(r)}>
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const wrapper: React.CSSProperties = { position: 'relative', width: '100%', maxWidth: 320 }
const inputRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: '#fffaf3', borderRadius: 20, padding: '10px 16px',
  boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
}
const inputStyle: React.CSSProperties = {
  border: 'none', outline: 'none', background: 'transparent',
  fontSize: 13.5, flex: 1, color: '#5c4a3a',
}
const dropdown: React.CSSProperties = {
  position: 'absolute', top: '110%', left: 0, right: 0,
  background: '#fffaf3', borderRadius: 14, boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
  overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
}
const resultRow: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
  border: 'none', background: 'transparent', fontSize: 13, color: '#5c4a3a',
  cursor: 'pointer', borderBottom: '1px solid #f2e8db',
}