'use client'
import { useState } from 'react'
import { setAdminAuthenticated } from '@/lib/adminAuth'

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAdminAuthenticated(true)
      onSuccess()
    } else {
      setError(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: '80px auto' }}>
      <h2>Admin Login</h2>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin password"
        style={{ width: '100%', padding: 8, marginTop: 12 }}
      />
      {error && <p style={{ color: 'red' }}>Incorrect password</p>}
      <button type="submit" style={{ marginTop: 12, padding: '8px 16px' }}>
        Log in
      </button>
    </form>
  )
}