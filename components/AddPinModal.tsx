'use client'
import { useState } from 'react'
import { createPin } from '@/hooks/useCreatePin'

export function AddPinModal({
  userId,
  lat,
  lng,
  defaultRadius,
  onClose,
  onCreated,
}: {
  userId: string
  lat: number
  lng: number
  defaultRadius: number
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [pinType, setPinType] = useState<'bucket_list' | 'capsule'>('bucket_list')
  const [unlockMode, setUnlockMode] = useState<'solo' | 'together'>('solo')
  const [note, setNote] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
    setPhotoPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Give it a title')
      return
    }
    setSaving(true)
    setError(null)

    const result = await createPin({
      createdBy: userId,
      pinType,
      unlockMode,
      lat,
      lng,
      radiusM: defaultRadius,
      title: title.trim(),
      note: note.trim(),
      photoFile,
    })

    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onCreated()
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <h2 style={heading}>✨ New pin</h2>
        <p style={subheading}>You're dropping this right here on the map.</p>

        <form onSubmit={handleSubmit}>
          <div style={fieldGroup}>
            <label style={label}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Our first date spot"
              style={input}
              autoFocus
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Type</label>
            <div style={toggleRow}>
              <button
                type="button"
                onClick={() => setPinType('bucket_list')}
                style={pinType === 'bucket_list' ? toggleBtnActive : toggleBtn}
              >
                💙 Bucket list
              </button>
              <button
                type="button"
                onClick={() => setPinType('capsule')}
                style={pinType === 'capsule' ? toggleBtnActive : toggleBtn}
              >
                🧡 Time capsule
              </button>
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={label}>Unlock when...</label>
            <div style={toggleRow}>
              <button
                type="button"
                onClick={() => setUnlockMode('solo')}
                style={unlockMode === 'solo' ? toggleBtnActive : toggleBtn}
              >
                Either of us visits
              </button>
              <button
                type="button"
                onClick={() => setUnlockMode('together')}
                style={unlockMode === 'together' ? toggleBtnActive : toggleBtn}
              >
                We're both there
              </button>
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={label}>Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write something for later..."
              style={textarea}
              rows={3}
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Photo (optional)</label>
            {photoPreview && (
              <img src={photoPreview} alt="preview" style={photoPreviewStyle} />
            )}
            <label style={fileBtn}>
              {photoFile ? 'Change photo' : 'Add a photo'}
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
          </div>

          {error && <p style={errorText}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" disabled={saving} style={saveBtn}>
              {saving ? 'Placing...' : '📍 Drop pin'}
            </button>
            <button type="button" onClick={onClose} style={cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(60,45,35,0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
}
const card: React.CSSProperties = {
  background: '#fffaf3', borderRadius: 22, padding: 26,
  width: '100%', maxWidth: 380, maxHeight: '88vh', overflowY: 'auto',
  boxShadow: '0 12px 32px rgba(0,0,0,0.2)', fontFamily: 'system-ui, sans-serif',
}
const heading: React.CSSProperties = { fontSize: 22, margin: 0, color: '#5c4a3a' }
const subheading: React.CSSProperties = { fontSize: 13, color: '#a0897a', marginTop: 4, marginBottom: 20 }
const fieldGroup: React.CSSProperties = { marginBottom: 16 }
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#8a6f5c', marginBottom: 6 }
const input: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 10, border: '1px solid #eee0d0', fontSize: 14, boxSizing: 'border-box' }
const textarea: React.CSSProperties = { ...input, resize: 'vertical', fontFamily: 'inherit' }
const toggleRow: React.CSSProperties = { display: 'flex', gap: 8 }
const toggleBtn: React.CSSProperties = {
  flex: 1, padding: '10px 8px', borderRadius: 10, border: '1px solid #eee0d0',
  background: '#fff', fontSize: 12.5, cursor: 'pointer', color: '#8a6f5c',
}
const toggleBtnActive: React.CSSProperties = {
  ...toggleBtn, background: '#f4c98f', border: '1px solid #f4c98f', color: '#5c4a3a', fontWeight: 700,
}
const photoPreviewStyle: React.CSSProperties = { width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 12, marginBottom: 8 }
const fileBtn: React.CSSProperties = {
  display: 'inline-block', padding: '8px 14px', background: '#f5ebe0',
  borderRadius: 10, fontSize: 13, color: '#5c4a3a', cursor: 'pointer', fontWeight: 600,
}
const errorText: React.CSSProperties = { color: '#e05252', fontSize: 13, marginTop: 6 }
const saveBtn: React.CSSProperties = {
  flex: 1, padding: '12px 18px', background: '#8fd4a8', border: 'none',
  borderRadius: 12, fontWeight: 700, color: 'white', cursor: 'pointer', fontSize: 14,
}
const cancelBtn: React.CSSProperties = {
  padding: '12px 18px', background: 'transparent', border: '1px solid #ddd',
  borderRadius: 12, color: '#888', cursor: 'pointer', fontSize: 14,
}