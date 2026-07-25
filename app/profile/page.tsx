'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useVerifiedUser } from '@/hooks/useVerifiedUser'

export default function ProfilePage() {
  const router = useRouter()
  const { userId, checked } = useVerifiedUser()

  const [avatars, setAvatars] = useState<{ idle: string | null; inrange: string | null; celebrate: string | null }>({
    idle: null, inrange: null, celebrate: null,
  })
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    if (checked && !userId) {
      router.replace('/')
    }
  }, [checked, userId, router])

  // Fetch avatars once we have a verified user
  useEffect(() => {
    if (!userId) return
    supabase
      .from('users')
      .select('avatar_idle, avatar_inrange, avatar_celebrate')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) setAvatars({ idle: data.avatar_idle, inrange: data.avatar_inrange, celebrate: data.avatar_celebrate })
      })
  }, [userId])

  const handleUpload = async (state: 'idle' | 'inrange' | 'celebrate', file: File) => {
    if (!userId) return
    setUploading(state)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    formData.append('state', state)

    const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData })
    const json = await res.json()
    setUploading(null)
    if (json.error) { alert('Upload failed: ' + json.error); return }
    setAvatars((prev) => ({ ...prev, [state]: json.url }))
  }

  if (!userId) return null

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <button onClick={() => router.push('/map')} style={backBtn}>
        ← Back to map
      </button>

      <h1 style={{ marginBottom: 4, marginTop: 20 }}>Your character</h1>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>Only you can change your own look.</p>

      {(['idle', 'inrange', 'celebrate'] as const).map((state) => (
        <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: '#f2f2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {avatars[state] ? <img src={avatars[state]!} alt={state} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🙂'}
          </div>
          <div>
            <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: 4 }}>{state}</div>
            <label style={{ fontSize: 13, color: '#4a90d9', cursor: 'pointer' }}>
              {uploading === state ? 'Uploading...' : 'Upload image/GIF'}
              <input
                type="file"
                accept="image/*,image/gif"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleUpload(state, e.target.files[0])}
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  )
}

const backBtn: React.CSSProperties = {
  padding: '8px 16px', background: '#f4e4d4', border: 'none',
  borderRadius: 10, color: '#5c4a3a', fontWeight: 600, fontSize: 13, cursor: 'pointer',
}