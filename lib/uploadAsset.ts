import { supabase } from '@/lib/supabase'

export async function uploadAsset(file: File, path: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from('assets')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (error) {
    console.error('Upload failed:', error)
    return null
  }

  const { data } = supabase.storage.from('assets').getPublicUrl(path)
  return data.publicUrl
}