'use client'
import { useEffect, useState } from 'react'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { AdminLogin } from '@/components/AdminLogin'
import { useAdminConfig } from '@/hooks/useAdminConfig'
// import { uploadAsset } from '@/lib/uploadAsset'

function IconUploadRow({
  label, currentUrl, onUploaded,
}: { label: string; currentUrl: string | null; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `pins/${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${ext}`

    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', path)

    const res = await fetch('/api/upload-asset', { method: 'POST', body: formData })
    const json = await res.json()
    setUploading(false)
    if (json.url) onUploaded(json.url)
    else alert('Upload failed: ' + json.error)
    }
  return (
    <div style={rowStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={previewBox}>
          {currentUrl ? <img src={currentUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🖼️'}
        </div>
        <span style={{ fontWeight: 600, color: '#5c4a3a' }}>{label}</span>
      </div>
      <label style={uploadBtn}>
        {uploading ? 'Uploading...' : 'Change'}
        <input type="file" accept="image/*,image/gif" onChange={handleFile} style={{ display: 'none' }} />
      </label>
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [checked, setChecked] = useState(false)
  const { config, loading, saving, save } = useAdminConfig()

  const [form, setForm] = useState({
    together_window_seconds: 300,
    default_pin_radius_m: 100,
    fog_of_war_enabled: true,
    celebrate_duration_seconds: 3,
    capsule_icon_url: null as string | null,
    bucket_list_icon_url: null as string | null,
    note_icon_url: null as string | null,
    photo_icon_url: null as string | null,
  })

  useEffect(() => {
    setAuthed(isAdminAuthenticated())
    setChecked(true)
  }, [])

  useEffect(() => {
    if (config) setForm({ ...config })
  }, [config])

  if (!checked) return null
  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />
  if (loading) return <p style={{ padding: 40 }}>Loading config...</p>

  const patchAndSave = async (updates: Partial<typeof form>) => {
    const next = { ...form, ...updates }
    setForm(next)
    await save(updates)
  }

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await save({
      together_window_seconds: form.together_window_seconds,
      default_pin_radius_m: form.default_pin_radius_m,
      fog_of_war_enabled: form.fog_of_war_enabled,
      celebrate_duration_seconds: form.celebrate_duration_seconds,
    })
    if (error) alert('Save failed: ' + error.message)
    else alert('Saved! 🎉')
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 26, marginBottom: 4, color: '#5c4a3a' }}>🏡 Admin Cozy Corner</h1>
        <p style={{ color: '#a0897a', marginBottom: 28, fontSize: 14 }}>Tweak the world you two are building.</p>

        <h2 style={sectionTitle}>Pin & Icon Art</h2>
        <IconUploadRow label="Capsule icon" currentUrl={form.capsule_icon_url} onUploaded={(url) => patchAndSave({ capsule_icon_url: url })} />
        <IconUploadRow label="Bucket-list icon" currentUrl={form.bucket_list_icon_url} onUploaded={(url) => patchAndSave({ bucket_list_icon_url: url })} />
        <IconUploadRow label="Note icon" currentUrl={form.note_icon_url} onUploaded={(url) => patchAndSave({ note_icon_url: url })} />
        <IconUploadRow label="Photo icon" currentUrl={form.photo_icon_url} onUploaded={(url) => patchAndSave({ photo_icon_url: url })} />

        <h2 style={{ ...sectionTitle, marginTop: 32 }}>World Settings</h2>
        <form onSubmit={handleSettingsSave}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Together unlock window (seconds)</label>
            <input type="number" value={form.together_window_seconds}
              onChange={(e) => setForm({ ...form, together_window_seconds: Number(e.target.value) })}
              style={inputStyle} />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Default pin radius (meters)</label>
            <input type="number" value={form.default_pin_radius_m}
              onChange={(e) => setForm({ ...form, default_pin_radius_m: Number(e.target.value) })}
              style={inputStyle} />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Celebrate animation duration (seconds)</label>
            <input type="number" value={form.celebrate_duration_seconds}
              onChange={(e) => setForm({ ...form, celebrate_duration_seconds: Number(e.target.value) })}
              style={inputStyle} />
          </div>
          <div style={{ ...fieldGroup, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.fog_of_war_enabled}
              onChange={(e) => setForm({ ...form, fog_of_war_enabled: e.target.checked })} />
            <label style={{ ...labelStyle, marginBottom: 0 }}>Fog of war enabled</label>
          </div>
          <button type="submit" disabled={saving} style={saveBtn}>
            {saving ? 'Saving...' : '💾 Save world settings'}
          </button>
        </form>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', background: 'linear-gradient(160deg, #FDF3E7, #F6E4D4)',
  padding: '48px 16px', fontFamily: 'system-ui, sans-serif',
}
const cardStyle: React.CSSProperties = {
  maxWidth: 520, margin: '0 auto', background: '#fffaf3',
  borderRadius: 24, padding: 32, boxShadow: '0 8px 24px rgba(180,140,100,0.15)',
}
const sectionTitle: React.CSSProperties = { fontSize: 16, color: '#8a6f5c', marginBottom: 14, borderBottom: '1px solid #eee0d0', paddingBottom: 8 }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }
const previewBox: React.CSSProperties = { width: 44, height: 44, borderRadius: 12, background: '#f5ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 20 }
const uploadBtn: React.CSSProperties = { padding: '8px 14px', background: '#f4c98f', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#5c4a3a', cursor: 'pointer' }
const fieldGroup: React.CSSProperties = { marginBottom: 16 }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#8a6f5c', marginBottom: 6, fontWeight: 600 }
const inputStyle: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 10, border: '1px solid #eee0d0', fontSize: 14 }
const saveBtn: React.CSSProperties = { marginTop: 8, padding: '12px 22px', background: '#8fd4a8', border: 'none', borderRadius: 12, fontWeight: 700, color: 'white', cursor: 'pointer', fontSize: 14 }