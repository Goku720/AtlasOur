'use client'
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { fetchNearbyPlaces, type NearbyPlace } from '@/lib/nearbyPlaces'
import { lineString, point } from '@turf/helpers'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import lineSlice from '@turf/line-slice'
import turfLength from '@turf/length'
import type { RouteInfo } from '@/lib/directions'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type Pin = {
  id: string
  created_by: string
  lat: number
  lng: number
  title: string
  note: string | null
  photo_url: string | null
  pin_type: 'bucket_list' | 'capsule'
  status: string
}

function escapeHtml(s: string) {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function buildPopupHtml(pin: Pin, canDelete: boolean) {
  const deleteBtn = canDelete
    ? `<button data-delete-pin="${pin.id}" style="
        position: absolute; top: -6px; right: -6px;
        width: 22px; height: 22px; border-radius: 50%;
        border: none; background: #e8899e; color: white;
        font-size: 12px; line-height: 1; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      " title="Remove pin">✕</button>`
    : ''

  const directionsBtn = `
    <button data-directions-pin="${pin.lat},${pin.lng}" style="
      margin-top: 8px; padding: 6px 12px; background: #a8c5e8; color: white;
      border: none; border-radius: 10px; font-size: 12px; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
    ">🧭 Directions</button>
  `

  if (pin.status !== 'revealed') {
    return `
      <div style="position: relative; padding-top: 4px;">
        ${deleteBtn}
        <strong>${escapeHtml(pin.title)}</strong>
        <div>${directionsBtn}</div>
      </div>
    `
  }
  return `
    <div style="position: relative; padding-top: 4px; max-width:200px; font-family: system-ui, sans-serif;">
      ${deleteBtn}
      <strong>${escapeHtml(pin.title)}</strong>
      ${pin.photo_url ? `<img src="${pin.photo_url}" style="width:100%; border-radius:8px; margin:8px 0; display:block;" />` : ''}
      ${pin.note ? `<p style="font-size:13px; color:#555; margin:4px 0 0;">${escapeHtml(pin.note)}</p>` : ''}
      ${directionsBtn}
    </div>
  `
}

function createMarkerElement(
  pin: Pin,
  inRange: boolean,
  capsuleIconUrl: string | null,
  bucketListIconUrl: string | null
) {
  const el = document.createElement('div')
  const isCapsule = pin.pin_type === 'capsule'
  const customIcon = isCapsule ? capsuleIconUrl : bucketListIconUrl
  const revealed = pin.status === 'revealed'

  const wrapperStyle = revealed
    ? 'width: 40px; height: 40px; opacity: 0.75; cursor: pointer; filter: grayscale(15%); position: relative;'
    : `width: 44px; height: 44px; animation: bob 2.2s ease-in-out infinite; filter: ${
        inRange ? 'drop-shadow(0 0 8px rgba(255,214,107,0.9))' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))'
      }; cursor: pointer; position: relative;`

  if (customIcon) {
    el.innerHTML = `
      <div style="${wrapperStyle}">
        <img src="${customIcon}" alt="${escapeHtml(pin.title)}" style="width: 100%; height: 100%; object-fit: contain;" />
        ${revealed ? '<div style="position:absolute; top:-4px; right:-4px; font-size:14px;">✓</div>' : ''}
      </div>
    `
    return el
  }

  const bodyColor = isCapsule ? '#f4a988' : '#a8c5e8'
  const cheekColor = isCapsule ? '#e8836a' : '#7fa8d9'
  el.innerHTML = `
    <div style="${wrapperStyle}">
      <svg viewBox="0 0 44 44" width="100%" height="100%">
        <ellipse cx="22" cy="24" rx="17" ry="15" fill="${bodyColor}" stroke="white" stroke-width="2.5"/>
        <circle cx="16" cy="22" r="2.3" fill="#3a3a3a"/>
        <circle cx="28" cy="22" r="2.3" fill="#3a3a3a"/>
        <ellipse cx="12" cy="27" rx="3" ry="2" fill="${cheekColor}" opacity="0.6"/>
        <ellipse cx="32" cy="27" rx="3" ry="2" fill="${cheekColor}" opacity="0.6"/>
        <path d="M17 29 Q22 33 27 29" stroke="#3a3a3a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        ${isCapsule
          ? '<path d="M22 8 L24 12 L28 12 L25 15 L26 19 L22 17 L18 19 L19 15 L16 12 L20 12 Z" fill="#ffd66b" stroke="white" stroke-width="1"/>'
          : '<path d="M22 6 C19 3 14 5 14 9 C14 13 22 18 22 18 C22 18 30 13 30 9 C30 5 25 3 22 6 Z" fill="#e8899e" stroke="white" stroke-width="1"/>'}
      </svg>
      ${revealed ? '<div style="position:absolute; top:-4px; right:-4px; font-size:14px;">✓</div>' : ''}
    </div>
  `
  return el
}

function createSelfMarkerElement(color: string, avatarUrl: string | null) {
  const el = document.createElement('div')

  if (avatarUrl) {
    el.innerHTML = `
      <div style="width: 56px; height: 56px; position: relative;">
        <div style="
          position: absolute; top: 8px; left: 8px;
          width: 40px; height: 40px; border-radius: 50%;
          background: ${color}4d;
          animation: pulse-ring 1.8s ease-out infinite;
        "></div>
        <img src="${avatarUrl}" alt="You" style="width: 100%; height: 100%; object-fit: contain; position: relative;" />
      </div>
    `
    return el
  }

  el.innerHTML = `
    <div style="width: 52px; height: 52px; position: relative;">
      <div style="
        position: absolute; top: 6px; left: 6px;
        width: 40px; height: 40px; border-radius: 50%;
        background: ${color}33;
        animation: pulse-ring 1.8s ease-out infinite;
      "></div>
      <svg viewBox="0 0 52 52" width="52" height="52" style="position: relative;">
        <ellipse cx="26" cy="28" rx="19" ry="17" fill="${color}" stroke="white" stroke-width="3"/>
        <circle cx="18" cy="25" r="2.6" fill="#3a3a3a"/>
        <circle cx="34" cy="25" r="2.6" fill="#3a3a3a"/>
        <ellipse cx="13" cy="31" rx="3.4" ry="2.3" fill="white" opacity="0.4"/>
        <ellipse cx="39" cy="31" rx="3.4" ry="2.3" fill="white" opacity="0.4"/>
        <path d="M20 33 Q26 38 32 33" stroke="#3a3a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M26 5 C22 2 16 4 16 9 C16 14 26 20 26 20 C26 20 36 14 36 9 C36 4 30 2 26 5 Z" fill="#ffd66b" stroke="white" stroke-width="1.5"/>
      </svg>
    </div>
  `
  return el
}

function createPendingMarkerElement() {
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="width: 36px; height: 36px; animation: drop-bounce 0.5s ease-out;">
      <svg viewBox="0 0 36 36" width="36" height="36">
        <circle cx="18" cy="18" r="14" fill="#ffd66b" stroke="white" stroke-width="3" stroke-dasharray="4 3" />
        <text x="18" y="23" text-anchor="middle" font-size="16">📍</text>
      </svg>
    </div>
  `
  return el
}

function createPlaceMarkerElement(place: NearbyPlace) {
  const el = document.createElement('div')
  const emoji = place.category === 'cafe' ? '☕' : '🍽️'
  el.innerHTML = `
    <div style="
      width: 26px; height: 26px; border-radius: 50%;
      background: #fffaf3; display: flex; align-items: center; justify-content: center;
      font-size: 13px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      border: 1.5px solid #f0d9c0;
    ">${emoji}</div>
  `
  return el
}

function createSearchHighlightElement() {
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="width: 40px; height: 40px; position: relative;">
      <div style="
        position: absolute; top: 2px; left: 2px;
        width: 36px; height: 36px; border-radius: 50%;
        background: #ffd66b66;
        animation: pulse-ring 1.4s ease-out infinite;
      "></div>
      <svg viewBox="0 0 40 40" width="40" height="40" style="position: relative;">
        <circle cx="20" cy="20" r="9" fill="#ffd66b" stroke="white" stroke-width="3"/>
      </svg>
    </div>
  `
  return el
}

type PartnerPosition = { lat: number; lng: number; sharing: boolean } | null

export function MapView({
  pins,
  myPosition,
  currentUserId,
  nearbyPinIds = new Set(),
  selfColor = '#8fd4a8',
  partnerPosition = null,
  partnerColor = '#e8899e',
  capsuleIconUrl = null,
  bucketListIconUrl = null,
  selfAvatarUrl = null,
  partnerAvatarUrl = null,
  placementMode = false,
  pendingLocation = null,
  searchTarget = null,
  route = null,
  

  onPickLocation,
  onRequestDeletePin,
  onRequestDirections,  
  onRouteProgress,       
}: {
  pins: Pin[]
  myPosition: { lat: number; lng: number } | null
  currentUserId: string
  nearbyPinIds?: Set<string>
  selfColor?: string
  partnerPosition?: PartnerPosition
  partnerColor?: string
  capsuleIconUrl?: string | null
  bucketListIconUrl?: string | null
  selfAvatarUrl?: string | null
  partnerAvatarUrl?: string | null
  placementMode?: boolean
  pendingLocation?: { lat: number; lng: number } | null
  searchTarget?: { lat: number; lng: number; zoom?: number } | null
  route?: RouteInfo | null
  onPickLocation?: (lat: number, lng: number) => void
  onRequestDeletePin?: (pinId: string) => void
  onRequestDirections?: (lat: number, lng: number) => void   
  onRouteProgress?: (remainingKm: number) => void             
}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const selfMarker = useRef<mapboxgl.Marker | null>(null)
  const partnerMarker = useRef<mapboxgl.Marker | null>(null)
  const pendingMarker = useRef<mapboxgl.Marker | null>(null)
  const onRequestDeletePinRef = useRef(onRequestDeletePin)
  const hasCentered = useRef(false)
  const placeMarkers = useRef<mapboxgl.Marker[]>([])
  const searchMarker = useRef<mapboxgl.Marker | null>(null)
  const onRequestDirectionsRef = useRef(onRequestDirections)
  onRequestDirectionsRef.current = onRequestDirections

  onRequestDeletePinRef.current = onRequestDeletePin

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: myPosition ? [myPosition.lng, myPosition.lat] : [91.7362, 26.1445],
      zoom: 15,
      pitch: 45,   // ← tilt the camera
      dragRotate: true,       // enables right-click/two-finger tilt+rotate
      touchPitch: true,       // enables two-finger tilt on mobile
    })
    map.current.addControl(
    new mapboxgl.NavigationControl({ visualizePitch: true }),
    'top-right'
    )
    
    map.current.on('load', () => {
      const m = map.current!
      if (m.getLayer('water')) m.setPaintProperty('water', 'fill-color', '#cfe8e0')
      if (m.getLayer('land')) m.setPaintProperty('land', 'background-color', '#faf3e8')
      if (m.getLayer('background')) m.setPaintProperty('background', 'background-color', '#faf3e8')
      m.getStyle().layers?.forEach((layer) => {
        if (layer.id.includes('road') && layer.type === 'line') {
          m.setPaintProperty(layer.id, 'line-color', '#f0d9c0')
        }
        if (layer.id.includes('poi-label') || layer.id.includes('transit-label')) {
          m.setLayoutProperty(layer.id, 'visibility', 'none')
        }
      })

      // 3D buildings
      m.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15.5,
        paint: {
          'fill-extrusion-color': '#f0dcc4',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.5,
        },
      })
    })

    setTimeout(() => map.current?.resize(), 100)
    const handleResize = () => map.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


  useEffect(() => {
  if (!map.current || !route) return
  const m = map.current

  const draw = () => {
    if (m.getSource('route')) {
      (m.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature', properties: {}, geometry: route.geometry,
      })
    } else {
      m.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: route.geometry },
      })
      m.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#e8899e', 'line-width': 4, 'line-opacity': 0.85 },
      })
    }
  }

  if (m.isStyleLoaded()) draw()
  else m.once('load', draw)
}, [route])


  useEffect(() => {
    if (!map.current) return
    const m = map.current

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!placementMode || !onPickLocation) return
      onPickLocation(e.lngLat.lat, e.lngLat.lng)
    }

    m.on('click', handleClick)
    m.getCanvas().style.cursor = placementMode ? 'crosshair' : ''

    return () => {
      m.off('click', handleClick)
    }
  }, [placementMode, onPickLocation])

  useEffect(() => {
    if (!map.current || !searchTarget) return

    map.current.flyTo({
      center: [searchTarget.lng, searchTarget.lat],
      zoom: searchTarget.zoom ?? map.current.getZoom(),
    })

    if (searchMarker.current) {
      searchMarker.current.remove()
      searchMarker.current = null
    }

    // only show the highlight for actual searches, not "recenter on me"
    if (searchTarget.zoom) {
      searchMarker.current = new mapboxgl.Marker(createSearchHighlightElement())
        .setLngLat([searchTarget.lng, searchTarget.lat])
        .addTo(map.current)
    }
  }, [searchTarget])

  useEffect(() => {
    if (!map.current) return
    if (pendingMarker.current) {
      pendingMarker.current.remove()
      pendingMarker.current = null
    }
    if (pendingLocation) {
      pendingMarker.current = new mapboxgl.Marker(createPendingMarkerElement())
        .setLngLat([pendingLocation.lng, pendingLocation.lat])
        .addTo(map.current)
    }
  }, [pendingLocation])

  useEffect(() => {
  if (!map.current || !route || !myPosition) return
  const m = map.current
  if (!m.getSource('route')) return

  const fullLine = lineString(route.geometry.coordinates)
  const userPt = point([myPosition.lng, myPosition.lat])
  const destCoords = route.geometry.coordinates[route.geometry.coordinates.length - 1]

  const snapped = nearestPointOnLine(fullLine, userPt)
  const remaining = lineSlice(snapped, point(destCoords), fullLine)

  ;(m.getSource('route') as mapboxgl.GeoJSONSource).setData({
    type: 'Feature', properties: {}, geometry: remaining.geometry,
  })

  const remainingKm = turfLength(remaining, { units: 'kilometers' })
  onRouteProgress?.(remainingKm)
}, [myPosition, route])

  useEffect(() => {
  if (!map.current || !myPosition) return
  if (!hasCentered.current) {
    map.current.flyTo({ center: [myPosition.lng, myPosition.lat] })
    hasCentered.current = true
  }
  if (selfMarker.current) {
    selfMarker.current.remove()
    selfMarker.current = null
  }
  selfMarker.current = new mapboxgl.Marker(createSelfMarkerElement(selfColor, selfAvatarUrl))
    .setLngLat([myPosition.lng, myPosition.lat])
    .addTo(map.current)
  }, [myPosition, selfColor, selfAvatarUrl])


  useEffect(() => {
    if (!map.current) return

    if (partnerPosition?.sharing && partnerPosition.lat && partnerPosition.lng) {
      if (partnerMarker.current) {
        partnerMarker.current.remove()
        partnerMarker.current = null
      }
      partnerMarker.current = new mapboxgl.Marker(
        createSelfMarkerElement(partnerColor, partnerAvatarUrl)
      )
        .setLngLat([partnerPosition.lng, partnerPosition.lat])
        .addTo(map.current)
    } else if (partnerMarker.current) {
      partnerMarker.current.remove()
      partnerMarker.current = null
    }
  }, [partnerPosition, partnerColor, partnerAvatarUrl])

  useEffect(() => {
  if (!map.current) return
  const m = map.current
  let debounceTimer: ReturnType<typeof setTimeout>

  const loadPlaces = async () => {
    if (m.getZoom() < 14) {
      placeMarkers.current.forEach((mk) => mk.remove())
      placeMarkers.current = []
      return
    }
    const center = m.getCenter()
    try {
      const places = await fetchNearbyPlaces(center.lat, center.lng)
      placeMarkers.current.forEach((mk) => mk.remove())
      placeMarkers.current = places.map((p) =>
        new mapboxgl.Marker(createPlaceMarkerElement(p))
          .setLngLat([p.lng, p.lat])
          .setPopup(new mapboxgl.Popup({ offset: 15 }).setText(p.name))
          .addTo(m)
      )
    } catch (err) {
      console.error('Failed to load nearby places:', err)
    }
  }

  const handleMoveEnd = () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(loadPlaces, 400)
  }

  m.on('moveend', handleMoveEnd)
  if (m.isStyleLoaded()) loadPlaces()
  else m.once('load', loadPlaces)

  return () => {
    clearTimeout(debounceTimer)
    m.off('moveend', handleMoveEnd)
  }
  }, [])


  // Pin markers — delete (✕) button only rendered for pins the current user created
  useEffect(() => {
    if (!map.current) return
    markers.current.forEach((m) => m.remove())
    markers.current = []

    pins.forEach((pin) => {
      const canDelete = pin.created_by === currentUserId
      const el = createMarkerElement(pin, nearbyPinIds.has(pin.id), capsuleIconUrl, bucketListIconUrl)
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(buildPopupHtml(pin, canDelete))

      if (canDelete) {
        popup.on('open', () => {
          const popupEl = popup.getElement()
          const deleteButton = popupEl?.querySelector(`[data-delete-pin="${pin.id}"]`)
          deleteButton?.addEventListener('click', (e) => {
            e.stopPropagation()
            onRequestDeletePinRef.current?.(pin.id)
          })
        })
      }

      // directions works for every pin, not just deletable ones — separate from the canDelete block
 // directions works for every pin, not just deletable ones — separate from the canDelete block
    popup.on('open', () => {
      const popupEl = popup.getElement()
      const directionsButton = popupEl?.querySelector(`[data-directions-pin]`)
      directionsButton?.addEventListener('click', (e) => {
        e.stopPropagation()
        onRequestDirectionsRef.current?.(pin.lat, pin.lng)
      })
    })

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(map.current!)
      markers.current.push(marker)
    })
  }, [pins, nearbyPinIds, capsuleIconUrl, bucketListIconUrl, currentUserId])

  return (
    <>
      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes drop-bounce {
          0% { transform: translateY(-16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </>
  )
}