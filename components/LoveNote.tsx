'use client'
import { useEffect, useState } from 'react'

const HEART_ANGLES = [10, 55, 100, 145, 190, 235, 280, 325]

export function LoveNote({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // trigger the entrance animation a beat after mount
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 350)
  }

  return (
    <div style={{ ...overlay, opacity: visible ? 1 : 0 }} onClick={handleDismiss}>
      <style>{`
        @keyframes heart-drift {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-140px) scale(1.1); opacity: 0; }
        }
        @keyframes text-pop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes big-heart-beat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
      `}</style>

      <div style={content} onClick={(e) => e.stopPropagation()}>
        <div style={heartField}>
          {HEART_ANGLES.map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            const startX = Math.cos(rad) * 90
            return (
              <span
                key={angle}
                style={{
                  position: 'absolute', left: `calc(50% + ${startX}px)`, bottom: 0,
                  fontSize: 16 + (i % 3) * 6,
                  animation: `heart-drift ${2.4 + (i % 3) * 0.4}s ease-in infinite`,
                  animationDelay: `${i * 0.25}s`,
                }}
              >
                💗
              </span>
            )
          })}
        </div>

        <div style={{ fontSize: 72, animation: 'big-heart-beat 1.4s ease-in-out infinite' }}>💕</div>

        <h1 style={{ ...titleStyle, animation: 'text-pop 0.5s ease 0.15s both' }}>
          I love you, Puchkiii
        </h1>
        <p style={{ ...subtitleStyle, animation: 'text-pop 0.5s ease 0.3s both' }}>
          welcome to our little world ✨
        </p>

        <button style={{ ...dismissBtn, animation: 'text-pop 0.5s ease 0.45s both' }} onClick={handleDismiss}>
          💖
        </button>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 5000,
  background: 'linear-gradient(160deg, #ffd9e6, #ffe8d6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'opacity 0.35s ease', cursor: 'pointer',
}
const content: React.CSSProperties = {
  position: 'relative', display: 'flex', flexDirection: 'column',
  alignItems: 'center', textAlign: 'center', padding: 24, maxWidth: 340,
}
const heartField: React.CSSProperties = {
  position: 'absolute', bottom: -10, left: 0, right: 0, height: 1, pointerEvents: 'none',
}
const titleStyle: React.CSSProperties = {
  fontSize: 28, color: '#a3355a', margin: '18px 0 6px',
  fontFamily: '"Segoe Print", "Bradley Hand", cursive, system-ui, sans-serif',
}
const subtitleStyle: React.CSSProperties = { fontSize: 15, color: '#b06b7a', margin: 0 }
const dismissBtn: React.CSSProperties = {
  marginTop: 26, width: 54, height: 54, borderRadius: '50%', border: 'none',
  background: 'white', fontSize: 22, cursor: 'pointer', boxShadow: '0 4px 14px rgba(163,53,90,0.25)',
}