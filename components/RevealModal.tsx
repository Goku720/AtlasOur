'use client'
import { useState } from 'react'

type Phase = 'closed' | 'opening' | 'revealed'

const SPARKLE_ANGLES = [0, 40, 80, 120, 160, 200, 240, 280, 320]

export function RevealModal({
  title,
  note,
  photoUrl,
  pinType,
  onClose,
  skipAnimation = false,
}: {
  title: string
  note: string | null
  photoUrl: string | null
  pinType: 'bucket_list' | 'capsule'
  onClose: () => void
  skipAnimation?: boolean
}) {
  const [phase, setPhase] = useState<Phase>(skipAnimation ? 'revealed' : 'closed')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const handleOpen = () => {
    setPhase('opening')
    setTimeout(() => setPhase('revealed'), 650)
  }

  const emoji = pinType === 'capsule' ? '🧡' : '💙'

  return (
    <>
      <div style={overlay} onClick={phase === 'revealed' ? onClose : undefined}>
        <style>{`
          @keyframes float-bob {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-8px) scale(1.03); }
          }
          @keyframes burst-scale {
            0% { transform: scale(1); }
            40% { transform: scale(1.35) rotate(-6deg); }
            70% { transform: scale(0.9) rotate(4deg); }
            100% { transform: scale(0) rotate(0deg); opacity: 0; }
          }
          @keyframes sparkle-fly {
            0% { transform: translate(0, 0) scale(0.4); opacity: 0; }
            25% { opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(1.1); opacity: 0; }
          }
          @keyframes fade-slide-up {
            0% { opacity: 0; transform: translateY(14px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes pop-in {
            0% { opacity: 0; transform: scale(0.85); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes lightbox-fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>

        <div style={card} onClick={(e) => e.stopPropagation()}>
          {phase !== 'revealed' && (
            <div style={closedWrap}>
              <div
                style={{
                  fontSize: 64,
                  animation: phase === 'opening' ? 'burst-scale 0.65s ease forwards' : 'float-bob 2s ease-in-out infinite',
                  cursor: phase === 'closed' ? 'pointer' : 'default',
                }}
                onClick={phase === 'closed' ? handleOpen : undefined}
              >
                {emoji}
              </div>

              {phase === 'opening' &&
                SPARKLE_ANGLES.map((angle, i) => {
                  const rad = (angle * Math.PI) / 180
                  const distance = 70 + (i % 3) * 12
                  const tx = Math.cos(rad) * distance
                  const ty = Math.sin(rad) * distance
                  return (
                    <span
                      key={angle}
                      style={{
                        position: 'absolute', top: '50%', left: '50%', fontSize: 18,
                        // @ts-ignore custom properties for the keyframe
                        '--tx': `${tx}px`, '--ty': `${ty}px`,
                        animation: `sparkle-fly 0.7s ease-out forwards`,
                        animationDelay: `${i * 20}ms`,
                      }}
                    >
                      ✨
                    </span>
                  )
                })}

              {phase === 'closed' && <p style={tapHint}>Tap to open ✨</p>}
            </div>
          )}

          {phase === 'revealed' && (
            <>
              <div style={{ ...sparkleRow, animation: skipAnimation ? undefined : 'pop-in 0.4s ease' }}>
                {emoji} ✨ {emoji}
              </div>

              {photoUrl && (
                <div
                  style={{
                    ...photoFrame,
                    animation: skipAnimation ? undefined : 'fade-slide-up 0.45s ease 0.05s both',
                    cursor: 'zoom-in', position: 'relative',
                  }}
                  onClick={() => setLightboxOpen(true)}
                >
                  <img src={photoUrl} alt={title} style={photoImg} />
                  <div style={zoomHint}>🔍 Tap to enlarge</div>
                </div>
              )}

              <h2 style={{ ...titleStyle, animation: skipAnimation ? undefined : 'fade-slide-up 0.45s ease 0.15s both' }}>
                {title}
              </h2>

              {note && (
                <div style={{ ...noteCard, animation: skipAnimation ? undefined : 'fade-slide-up 0.45s ease 0.25s both' }}>
                  <p style={noteText}>{note}</p>
                </div>
              )}

              {!note && !photoUrl && (
                <p style={{ ...emptyText, animation: skipAnimation ? undefined : 'fade-slide-up 0.45s ease 0.15s both' }}>
                  Just a sweet little marker of this spot 💫
                </p>
              )}

              <button
                onClick={onClose}
                style={{ ...closeBtn, animation: skipAnimation ? undefined : 'fade-slide-up 0.45s ease 0.35s both' }}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>

      {lightboxOpen && photoUrl && (
        <div style={lightboxOverlay} onClick={() => setLightboxOpen(false)}>
          <img src={photoUrl} alt={title} style={lightboxImg} />
          <button style={lightboxCloseBtn} onClick={() => setLightboxOpen(false)}>
            ✕
          </button>
        </div>
      )}
    </>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(60,45,35,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 3000, padding: 20,
}
const card: React.CSSProperties = {
  background: '#fffaf3', borderRadius: 26, padding: 26,
  width: '100%', maxWidth: 380, maxHeight: '85vh', overflowY: 'auto',
  boxShadow: '0 16px 40px rgba(0,0,0,0.25)', fontFamily: 'system-ui, sans-serif',
  textAlign: 'center', position: 'relative',
}
const closedWrap: React.CSSProperties = {
  position: 'relative', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', minHeight: 180,
}
const tapHint: React.CSSProperties = { fontSize: 14, color: '#8a6f5c', marginTop: 14, fontWeight: 600 }
const sparkleRow: React.CSSProperties = { fontSize: 20, marginBottom: 10 }
const photoFrame: React.CSSProperties = {
  borderRadius: 18, overflow: 'hidden', marginBottom: 16,
  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
}
const photoImg: React.CSSProperties = { width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }
const zoomHint: React.CSSProperties = {
  position: 'absolute', bottom: 8, right: 10, background: 'rgba(0,0,0,0.55)',
  color: 'white', fontSize: 11, padding: '3px 9px', borderRadius: 10,
}
const titleStyle: React.CSSProperties = { fontSize: 21, color: '#5c4a3a', margin: '0 0 14px' }
const noteCard: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: '18px 16px',
  boxShadow: 'inset 0 0 0 1px #f0e4d4', marginBottom: 8,
}
const noteText: React.CSSProperties = {
  fontFamily: '"Segoe Print", "Bradley Hand", cursive, system-ui, sans-serif',
  fontSize: 16, color: '#4a3a2c', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap',
}
const emptyText: React.CSSProperties = { fontSize: 14, color: '#a0897a', marginBottom: 8 }
const closeBtn: React.CSSProperties = {
  marginTop: 16, padding: '11px 28px', background: '#8fd4a8', border: 'none',
  borderRadius: 12, fontWeight: 700, color: 'white', cursor: 'pointer', fontSize: 14,
}
const lightboxOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 4000, padding: 20, animation: 'lightbox-fade-in 0.2s ease',
}
const lightboxImg: React.CSSProperties = {
  maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8,
}
const lightboxCloseBtn: React.CSSProperties = {
  position: 'fixed', top: 18, right: 18, width: 40, height: 40, borderRadius: '50%',
  border: 'none', background: 'rgba(255,255,255,0.9)', fontSize: 16, cursor: 'pointer',
}