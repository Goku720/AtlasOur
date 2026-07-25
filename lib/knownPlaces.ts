import type { NearbyPlace } from './nearbyPlaces'

// Places that don't show up reliably via Mapbox's category search —
// add here as you find gaps.
export const KNOWN_PLACES: NearbyPlace[] = [
  {
    id: 'known-soi11',
    name: 'Soi 11',
    category: 'restaurant',
    lat: 26.1438705,
    lng: 91.8118787,
  },
]