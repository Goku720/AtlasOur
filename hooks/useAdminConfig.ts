'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type AppConfig = {
  id: number
  together_window_seconds: number
  default_pin_radius_m: number
  fog_of_war_enabled: boolean
  celebrate_duration_seconds: number
  capsule_icon_url: string | null
  bucket_list_icon_url: string | null
  note_icon_url: string | null
  photo_icon_url: string | null
}

export function useAdminConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .eq('id', 1)
      .single()
    if (!error) setConfig(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (updates: Partial<AppConfig>) => {
    setSaving(true)
    const res = await fetch('/api/admin-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const json = await res.json()
    setSaving(false)
    if (json.data) setConfig(json.data)
    return { data: json.data, error: json.error ? { message: json.error } : null }
  }

  return { config, loading, saving, save, reload: load }
}