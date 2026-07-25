'use client'

const KEY = 'atlas_seen_love_note'

export function hasSeenLoveNote(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(KEY) === 'true'
}

export function markLoveNoteSeen() {
  localStorage.setItem(KEY, 'true')
}