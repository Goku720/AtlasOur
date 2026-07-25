'use client'
import { supabase } from '@/lib/supabase'

export type CreatePinInput = {
  createdBy: string
  pinType: 'bucket_list' | 'capsule'
  unlockMode: 'solo' | 'together'
  lat: number
  lng: number
  radiusM: number
  title: string
  note?: string
  photoFile?: File | null
}

async function uploadPinPhoto(file: File, userId: string): Promise<string | null> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('userId', userId)

  const res = await fetch('/api/upload-pin-photo', { method: 'POST', body: formData })
  const json = await res.json()
  if (json.error) {
    console.error('Pin photo upload failed:', json.error)
    return null
  }
  return json.url as string
}

export async function createPin(input: CreatePinInput) {
  let photoUrl: string | null = null

  if (input.photoFile) {
    photoUrl = await uploadPinPhoto(input.photoFile, input.createdBy)
    if (!photoUrl) {
      return { error: 'Photo upload failed' }
    }
  }

  const { data, error } = await supabase
    .from('pins')
    .insert({
      created_by: input.createdBy,
      pin_type: input.pinType,
      unlock_mode: input.unlockMode,
      lat: input.lat,
      lng: input.lng,
      radius_m: input.radiusM,
      title: input.title,
      note: input.note || null,
      photo_url: photoUrl,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}