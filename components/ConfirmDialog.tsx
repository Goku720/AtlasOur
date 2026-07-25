'use client'

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Yes, remove it',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}: {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <div style={overlay} onClick={onCancel}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <h3 style={heading}>{title}</h3>
        <p style={message_}>{message}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={onConfirm}
            style={danger ? confirmBtnDanger : confirmBtn}
          >
            {confirmLabel}
          </button>
          <button onClick={onCancel} style={cancelBtn}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(60,45,35,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 2000, padding: 16,
}
const card: React.CSSProperties = {
  background: '#fffaf3', borderRadius: 20, padding: 24,
  width: '100%', maxWidth: 320, boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
  fontFamily: 'system-ui, sans-serif', textAlign: 'center',
}
const heading: React.CSSProperties = { fontSize: 18, margin: 0, color: '#5c4a3a' }
const message_: React.CSSProperties = { fontSize: 14, color: '#8a6f5c', marginTop: 10, lineHeight: 1.5 }
const confirmBtn: React.CSSProperties = {
  flex: 1, padding: '11px 16px', background: '#8fd4a8', border: 'none',
  borderRadius: 12, fontWeight: 700, color: 'white', cursor: 'pointer', fontSize: 14,
}
const confirmBtnDanger: React.CSSProperties = {
  ...confirmBtn, background: '#e8899e',
}
const cancelBtn: React.CSSProperties = {
  flex: 1, padding: '11px 16px', background: 'transparent', border: '1px solid #ddd',
  borderRadius: 12, color: '#888', cursor: 'pointer', fontSize: 14,
}