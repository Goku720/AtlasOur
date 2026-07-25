'use client'
import { useState } from 'react'

type Pin = {
  id: string
  created_by: string
  title: string
  pin_type: 'bucket_list' | 'capsule'
  unlock_mode: 'solo' | 'together'
  status: string
}

const STATUS_LABELS: Record<string, string> = {
  locked: 'Locked',
  in_range: 'In range',
  awaiting_partner: 'Waiting on partner',
  revealed: 'Revealed',
}

export function PinsPanel({
  userId,
  pins,
  onClose,
  onDeleteRequest,
  onViewRevealed,
}: {
  userId: string
  pins: Pin[]
  onClose: () => void
  onDeleteRequest: (pinId: string) => void
  onViewRevealed: (pinId: string) => void
}) {
  const [tab, setTab] = useState<'mine' | 'revealed'>('mine')

  const minePins = pins.filter((p) => p.created_by === userId)
  const revealedPins = pins.filter((p) => p.status === 'revealed')

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={headerRow}>
          <h2 style={heading}>📍 Pins</h2>
          <button style={closeIconBtn} onClick={onClose}>✕</button>
        </div>

        <div style={tabRow}>
          <button
            style={tab === 'mine' ? tabBtnActive : tabBtn}
            onClick={() => setTab('mine')}
          >
            My pins ({minePins.length})
          </button>
          <button
            style={tab === 'revealed' ? tabBtnActive : tabBtn}
            onClick={() => setTab('revealed')}
          >
            Revealed ({revealedPins.length})
          </button>
        </div>

        <div style={list}>
          {tab === 'mine' && (
            minePins.length === 0 ? (
              <p style={emptyText}>You haven't dropped any pins yet.</p>
            ) : (
              minePins.map((p) => (
                <div key={p.id} style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 18 }}>{p.pin_type === 'capsule' ? '🧡' : '💙'}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={cardTitle}>{p.title}</div>
                      <div style={cardMeta}>
                        {STATUS_LABELS[p.status] ?? p.status} · {p.unlock_mode === 'together' ? 'Together' : 'Solo'}
                      </div>
                    </div>
                  </div>
                  <button style={deleteIconBtn} onClick={() => onDeleteRequest(p.id)} title="Remove pin">
                    ✕
                  </button>
                </div>
              ))
            )
          )}

          {tab === 'revealed' && (
            revealedPins.length === 0 ? (
              <p style={emptyText}>Nothing revealed yet — go find something ✨</p>
            ) : (
              revealedPins.map((p) => (
                <button key={p.id} style={{ ...card, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer' }} onClick={() => onViewRevealed(p.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{p.pin_type === 'capsule' ? '🧡' : '💙'}</span>
                    <div style={cardTitle}>{p.title}</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#a0897a' }}>View →</span>
                </button>
              ))
            )
          )}
        </div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(60,45,35,0.35)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  zIndex: 2500,
}
const panel: React.CSSProperties = {
  background: '#fffaf3', borderTopLeftRadius: 24, borderTopRightRadius: 24,
  width: '100%', maxWidth: 480, maxHeight: '75vh', display: 'flex', flexDirection: 'column',
  boxShadow: '0 -8px 24px rgba(0,0,0,0.18)', fontFamily: 'system-ui, sans-serif',
  padding: '18px 20px 20px',
}
const headerRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }
const heading: React.CSSProperties = { fontSize: 19, color: '#5c4a3a', margin: 0 }
const closeIconBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#f4e4d4',
  color: '#5c4a3a', cursor: 'pointer', fontSize: 13,
}
const tabRow: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 14 }
const tabBtn: React.CSSProperties = {
  flex: 1, padding: '9px 8px', borderRadius: 10, border: '1px solid #eee0d0',
  background: '#fff', fontSize: 12.5, cursor: 'pointer', color: '#8a6f5c', fontWeight: 600,
}
const tabBtnActive: React.CSSProperties = {
  ...tabBtn, background: '#f4c98f', border: '1px solid #f4c98f', color: '#5c4a3a',
}
const list: React.CSSProperties = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }
const card: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#fff', padding: '11px 13px', borderRadius: 13,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
}
const cardTitle: React.CSSProperties = {
  fontWeight: 600, color: '#5c4a3a', fontSize: 13.5,
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}
const cardMeta: React.CSSProperties = { fontSize: 11.5, color: '#a0897a', marginTop: 2 }
const deleteIconBtn: React.CSSProperties = {
  width: 26, height: 26, borderRadius: '50%', border: 'none',
  background: '#f9dde3', color: '#c9556f', cursor: 'pointer', fontSize: 11, flexShrink: 0,
}
const emptyText: React.CSSProperties = { fontSize: 13, color: '#a0897a', textAlign: 'center', padding: '30px 10px' }