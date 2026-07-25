'use client'

import { USERS } from '@/lib/constants'

const KEY = 'atlas_current_user'

export function getCurrentUser(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEY)
}

export function setCurrentUser(userId: string) {
  localStorage.setItem(KEY, userId)
}

export function clearCurrentUser() {
  localStorage.removeItem(KEY)
}

export function isValidUser(userId: string) {
  return Object.values(USERS).includes(userId)
}