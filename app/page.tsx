'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { USERS } from '@/lib/constants'
import { getCurrentUser, setCurrentUser } from '@/lib/currentUser'

export default function EntryPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const existing = getCurrentUser()
    if (existing) {
      router.replace('/map')
    } else {
      setChecked(true)
    }
  }, [router])

  if (!checked) return null

  const openPasswordPrompt = (userId: string) => {
    setSelectedUser(userId)
    setPassword('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/user-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, password }),
      })
      const json = await res.json()

      if (json.ok) {
        setCurrentUser(selectedUser)
        router.push('/map')
      } else {
        setError(json.error || 'Incorrect password')
      }
    } catch (err: any) {
      console.error('Login request failed:', err)
      setError('Something went wrong — check the console')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="entry-page">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');

        .entry-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ffe8cc, #c8f4e6);
          font-family: system-ui, sans-serif;
          padding: 24px 16px;
          box-sizing: border-box;
        }
        .entry-title {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 4px;
          color: #3a3a3a;
        }
        .entry-subtitle {
          font-size: 16px;
          color: #666;
          margin-bottom: 32px;
          text-align: center;
        }
        .user-grid {
          display: flex;
          gap: 20px;
        }
        .user-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 24px 32px;
          border-radius: 20px;
          border: none;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          font-size: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          width: 180px;
        }
        .user-card:hover {
          transform: scale(1.04) translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
        }
        .name-text {
          font-weight: 700;
          font-size: 17px;
          color: #3a3a3a;
        }
        .nickname {
          font-family: 'Caveat', cursive;
          font-size: 20px;
          font-weight: 600;
          display: block;
          margin-top: 2px;
        }
        .avatar-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #ffdda1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        .password-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #fff;
          padding: 28px 32px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          width: 100%;
          max-width: 300px;
          box-sizing: border-box;
        }
        .admin-link {
          margin-top: 48px;
          font-size: 12px;
          color: #999;
          text-decoration: none;
        }

        /* Mobile */
        @media (max-width: 480px) {
          .entry-title {
            font-size: 28px;
          }
          .entry-subtitle {
            font-size: 14px;
            margin-bottom: 24px;
          }
          .user-grid {
            flex-direction: column;
            gap: 14px;
            width: 100%;
            max-width: 280px;
          }
          .user-card {
            width: 100%;
            flex-direction: row;
            justify-content: flex-start;
            padding: 16px 20px;
            gap: 14px;
          }
          .user-card:hover {
            transform: scale(1.02);
          }
          .avatar-circle {
            width: 46px;
            height: 46px;
            font-size: 22px;
            flex-shrink: 0;
          }
          .name-text {
            font-size: 16px;
          }
          .nickname {
            font-size: 17px;
            margin-top: 0;
          }
          /* stack name+nickname column inside the now-row card */
          .user-card > div:not(.avatar-circle) {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <h1 className="entry-title">AtlasOur</h1>
      <p className="entry-subtitle">Who's exploring today?</p>

      {!selectedUser ? (
        <div className="user-grid">
          <button className="user-card" onClick={() => openPasswordPrompt(USERS.Neha)}>
            <div className="avatar-circle">👩</div>
            <div>
              <span className="name-text">Neha</span>
              <span className="nickname" style={{ color: '#c96b82' }}>his puchki wifey 💕</span>
            </div>
          </button>
          <button className="user-card" onClick={() => openPasswordPrompt(USERS.Samir)}>
            <div className="avatar-circle">🧑</div>
            <div>
              <span className="name-text">Samir</span>
              <span className="nickname" style={{ color: '#5a9e72' }}>her HarshaGotho 💚</span>
            </div>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="password-form">
          <p style={styles.passwordLabel}>
            Enter password for {selectedUser === USERS.Samir ? 'Samir' : 'Neha'}
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={styles.passwordInput}
          />
          {error && <p style={styles.errorText}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, width: '100%' }}>
            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Checking...' : 'Enter'}
            </button>
            <button type="button" onClick={() => setSelectedUser(null)} style={styles.backBtn}>
              Back
            </button>
          </div>
        </form>
      )}

      <a href="/admin" className="admin-link">Admin</a>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  passwordLabel: { fontSize: 14, color: '#555', marginBottom: 10, fontWeight: 600 },
  passwordInput: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    border: '1px solid #ddd',
    fontSize: 14,
    boxSizing: 'border-box',
  },
  errorText: { color: '#e05252', fontSize: 13, marginTop: 8 },
  submitBtn: {
    flex: 1,
    padding: '10px 18px',
    background: '#8fd4a8',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    color: 'white',
    cursor: 'pointer',
  },
  backBtn: {
    flex: 1,
    padding: '10px 18px',
    background: 'transparent',
    border: '1px solid #ccc',
    borderRadius: 10,
    color: '#666',
    cursor: 'pointer',
  },
}