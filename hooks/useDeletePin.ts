'use client'

export async function deletePin(pinId: string, userId: string) {
  const res = await fetch('/api/delete-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinId, userId }),
  })
  const json = await res.json()
  if (json.error) return { error: json.error }
  return { success: true }
}