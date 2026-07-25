'use client'
import { useEffect, useState } from 'react'
import { getCurrentUser, setCurrentUser, clearCurrentUser } from '@/lib/currentUser'

export function useVerifiedUser() {
  const [userId, setUserId] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function verify() {
      const localGuess = getCurrentUser()
      if (!localGuess) {
        setChecked(true)
        return
      }

      try {
        const res = await fetch('/api/me')
        const json = await res.json()
        if (cancelled) return

        if (json.userId && json.userId === localGuess) {
          // Server confirms the session actually matches what localStorage claims
          setUserId(json.userId)
        } else if (json.userId) {
          // Server has a valid session, but it doesn't match localStorage — trust the server
          setCurrentUser(json.userId)
          setUserId(json.userId)
        } else {
          // No valid server session — localStorage claim can't be trusted, clear it
          clearCurrentUser()
          setUserId(null)
        }
      } catch (err) {
        console.error('Session verification failed:', err)
        clearCurrentUser()
        setUserId(null)
      } finally {
        if (!cancelled) setChecked(true)
      }
    }

    verify()
    return () => { cancelled = true }
  }, [])

  return { userId, checked }
}