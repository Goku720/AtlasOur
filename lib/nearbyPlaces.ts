import { isWithinRadius } from '@/lib/geo'
import { KNOWN_PLACES } from './knownPlaces'

export type NearbyPlace = {
  id: string
  name: string
  category: 'cafe' | 'restaurant'
  lat: number
  lng: number
}

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius = 1200
): Promise<NearbyPlace[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const categories: Array<'cafe' | 'restaurant'> = ['cafe', 'restaurant']
  const all: NearbyPlace[] = []

  for (const category of categories) {
    const url = `https://api.mapbox.com/search/searchbox/v1/category/${category}?proximity=${lng},${lat}&limit=25&access_token=${token}`
    try {
      const res = await fetch(url)
      const json = await res.json()
      for (const f of json.features || []) {
        const [plng, plat] = f.geometry.coordinates
        if (!isWithinRadius(lat, lng, plat, plng, radius)) continue
        all.push({
          id: f.properties.mapbox_id,
          name: f.properties.name,
          category,
          lat: plat,
          lng: plng,
        })
      }
        for (const place of KNOWN_PLACES) {
        if (!isWithinRadius(lat, lng, place.lat, place.lng, radius)) continue
        if (all.some((p) => p.id === place.id)) continue
        all.push(place)
    }
    } catch (err) {
      console.error(`Failed to fetch ${category}s:`, err)
    }
  }

  return all
}