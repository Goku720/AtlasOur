export type RouteInfo = {
  geometry: GeoJSON.LineString
  distanceMeters: number
  durationSeconds: number
}

export async function fetchRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<RouteInfo | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&access_token=${token}`
  const res = await fetch(url)
  const json = await res.json()
  const route = json.routes?.[0]
  if (!route) return null
  return {
    geometry: route.geometry,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  }
}