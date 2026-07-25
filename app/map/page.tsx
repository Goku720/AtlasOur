'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapView } from '@/components/MapView'
import { AddPinModal } from '@/components/AddPinModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { getCurrentUser, clearCurrentUser } from '@/lib/currentUser'
import { USERS } from '@/lib/constants'
import { useLocationSharing } from '@/hooks/useLocationSharing'
import { usePartnerLocation } from '@/hooks/usePartnerLocation'
import { usePinProximity } from '@/hooks/usePinProximity'
import { tapReveal } from '@/hooks/usePinReveal'
import { deletePin } from '@/hooks/useDeletePin'
import { useUserAvatars } from '@/hooks/useUserAvatars'
import { useAdminConfig } from '@/hooks/useAdminConfig'
import { SearchBar } from '@/components/SearchBar'
import { fetchRoute, type RouteInfo } from '@/lib/directions'
import { RevealModal } from '@/components/RevealModal'
import { PinsPanel } from '@/components/PinsPanel'

export default function MapPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const { config } = useAdminConfig()

  const [placementMode, setPlacementMode] = useState(false)
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pinPendingDelete, setPinPendingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [searchTarget, setSearchTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)

  const [remainingKm, setRemainingKm] = useState<number | null>(null)

  const [revealModalPin, setRevealModalPin] = useState<typeof pins[number] | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [skipRevealAnimation, setSkipRevealAnimation] = useState(false)

  useEffect(() => {
    const existing = getCurrentUser()
    if (!existing) {
      router.replace('/')
    } else {
      setUserId(existing)
      setChecked(true)
    }
  }, [router])

  const { myPosition, startSharing, sharing, error } = useLocationSharing(userId ?? '')
  const partnerId = userId === USERS.Samir ? USERS.Neha : USERS.Samir
  const partnerLocation = usePartnerLocation(partnerId)
  const { pins, nearbyPinIds, refetchPins } = usePinProximity(myPosition?.lat ?? null, myPosition?.lng ?? null)
  const { myAvatarIdle, partnerAvatarIdle } = useUserAvatars(userId ?? '', partnerId)

  const revealablePins = pins.filter((p) => nearbyPinIds.has(p.id) && p.status !== 'revealed')
  const pinAwaitingDeleteTitle = pins.find((p) => p.id === pinPendingDelete)?.title

  const [route, setRoute] = useState<RouteInfo | null>(null)
  const [routeDestination, setRouteDestination] = useState<{ lat: number; lng: number } | null>(null)

  const handleGetDirections = async (lat: number, lng: number) => {
    if (!myPosition) return
    const r = await fetchRoute(myPosition.lat, myPosition.lng, lat, lng)
    setRoute(r)
    setRouteDestination({ lat, lng })
  }

  const handleStartNavigation = () => {
    if (!routeDestination) return
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${routeDestination.lat},${routeDestination.lng}`,
      '_blank'
    )
  }

  const handleLogout = () => {
    clearCurrentUser()
    router.replace('/')
  }

  const handlePickLocation = (lat: number, lng: number) => {
    setPendingLocation({ lat, lng })
    setPlacementMode(false)
  }

  const handleModalClose = () => setPendingLocation(null)
  const handlePinCreated = () => {
    setPendingLocation(null)
    refetchPins()
  }

  const handleRecenter = () => {
    if (myPosition) setSearchTarget({ ...myPosition })
  }

  const handleConfirmDelete = async () => {
    if (!pinPendingDelete || !userId) return
    setDeleting(true)
    const result = await deletePin(pinPendingDelete, userId)
    setDeleting(false)
    setPinPendingDelete(null)
    if (result.error) {
      alert('Could not remove pin: ' + result.error)
      return
    }
    refetchPins()
  }

  useEffect(() => {
    if (remainingKm !== null && remainingKm < 0.03) {
      setRoute(null)
      setRouteDestination(null)
      setRemainingKm(null)
    }
  }, [remainingKm])

  if (!checked || !userId) return null

  // Bottom overlay elements stack vertically instead of colliding:
  // sheet peek (if any) sits at the very bottom, route card sits above that,
  // and the floating action icons sit above whichever of those is showing.
  const peekReserved = revealablePins.length > 0 && !sheetOpen ? 56 : 0
  const routeReserved = route ? 84 : 0
  const iconsBottomOffset = 20 + peekReserved + routeReserved
  const routeCardBottom = 16 + peekReserved
  const hideFloatingChrome = sheetOpen // sheet expanded covers ~48vh, decluttering the rest while it's open

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <MapView
        pins={pins}
        myPosition={myPosition}
        currentUserId={userId}
        nearbyPinIds={nearbyPinIds}
        selfColor={userId === USERS.Samir ? '#8fd4a8' : '#e8899e'}
        partnerPosition={partnerLocation}
        partnerColor={userId === USERS.Samir ? '#e8899e' : '#8fd4a8'}
        capsuleIconUrl={config?.capsule_icon_url ?? null}
        bucketListIconUrl={config?.bucket_list_icon_url ?? null}
        selfAvatarUrl={myAvatarIdle}
        partnerAvatarUrl={partnerAvatarIdle}
        placementMode={placementMode}
        pendingLocation={pendingLocation}
        searchTarget={searchTarget}
        route={route}
        onPickLocation={handlePickLocation}
        onRequestDeletePin={(pinId) => setPinPendingDelete(pinId)}
        onRequestDirections={handleGetDirections}
        onRouteProgress={(km) => setRemainingKm(km)}
      />

      {/* Top band: search bar full-width, icon row stacked below it — never side by side */}
      {!hideFloatingChrome && (
        <div style={topBand}>
          <SearchBar
            proximity={myPosition}
            onSelect={(lat, lng) => setSearchTarget({ lat, lng, zoom: 17 })}
          />
          <div style={topIconRow}>
            <IconButton title="My Character" onClick={() => router.push('/profile')}>
              🧑
            </IconButton>
            <IconButton title="My Pins" onClick={() => setPanelOpen(true)}>
              📍
            </IconButton>
            <IconButton title="Log out" onClick={handleLogout}>
              🚪
            </IconButton>
          </div>
        </div>
      )}

      {/* Bottom-right action column — offset dynamically to clear route card / sheet peek */}
      {!hideFloatingChrome && (
        <div style={{ position: 'absolute', bottom: iconsBottomOffset, right: 14, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10, transition: 'bottom 0.2s ease' }}>
          {sharing && (
            <IconButton
              title={placementMode ? 'Cancel placing pin' : 'Add pin'}
              onClick={() => setPlacementMode((v) => !v)}
              active={placementMode}
              large
            >
              {placementMode ? '✖️' : '📌'}
            </IconButton>
          )}
          {!sharing && (
            <IconButton title="Start sharing location" onClick={startSharing} large>
              🛰️
            </IconButton>
          )}
          <IconButton title="Recenter on me" onClick={handleRecenter}>
            🎯
          </IconButton>
        </div>
      )}

      {placementMode && (
        <div style={hintBubble}>Tap anywhere on the map to drop a pin ✨</div>
      )}

      {error && (
        <div style={{ ...hintBubble, background: '#fde2e2', color: '#a33', top: 116, bottom: 'auto' }}>
          {error}
        </div>
      )}

      {/* Route card — docks above the sheet peek if one is showing */}
      {route && (
        <div style={{ ...routeCard, bottom: routeCardBottom }}>
          <div style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600 }}>
            {(remainingKm ?? route.distanceMeters / 1000).toFixed(1)} km remaining
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button style={navBtn} onClick={handleStartNavigation}>🧭 Start Navigation</button>
            <button style={clearBtn} onClick={() => { setRoute(null); setRouteDestination(null); setRemainingKm(null) }}>✕</button>
          </div>
        </div>
      )}

      {/* Bottom sheet: nearby revealable pins — always docked at the very bottom */}
      {revealablePins.length > 0 && (
        <div style={{ ...sheet, height: sheetOpen ? '48vh' : 'auto', zIndex: 20 }}>
          <button style={sheetPeek} onClick={() => setSheetOpen((v) => !v)}>
            <span style={{ fontSize: 15 }}>
              {sheetOpen ? '▾' : '▴'} {revealablePins.length} pin{revealablePins.length > 1 ? 's' : ''} nearby ✨
            </span>
          </button>

          {sheetOpen && (
            <div style={sheetList}>
              {revealablePins.map((p) => (
                <div key={p.id} style={sheetCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{p.pin_type === 'capsule' ? '🧡' : '💙'}</span>
                    <span style={{ fontWeight: 600, color: '#5c4a3a', fontSize: 14 }}>{p.title}</span>
                  </div>
                  <button
                    style={revealBtn}
                    onClick={async () => {
                      await tapReveal(p, userId!, partnerId)
                      setSkipRevealAnimation(false)
                      setRevealModalPin(p)
                    }}
                  >
                    Reveal
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pendingLocation && (
        <AddPinModal
          userId={userId}
          lat={pendingLocation.lat}
          lng={pendingLocation.lng}
          defaultRadius={config?.default_pin_radius_m ?? 100}
          onClose={handleModalClose}
          onCreated={handlePinCreated}
        />
      )}

      {pinPendingDelete && (
        <ConfirmDialog
          title="Remove this pin?"
          message={`"${pinAwaitingDeleteTitle ?? 'This pin'}" will be gone for good — including any note or photo attached to it.`}
          confirmLabel={deleting ? 'Removing...' : 'Yes, remove it'}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPinPendingDelete(null)}
        />
      )}

      {revealModalPin && (
        <RevealModal
          title={revealModalPin.title}
          note={revealModalPin.note}
          photoUrl={revealModalPin.photo_url}
          pinType={revealModalPin.pin_type}
          skipAnimation={skipRevealAnimation}
          onClose={() => setRevealModalPin(null)}
        />
      )}

      {panelOpen && (
        <PinsPanel
          userId={userId}
          pins={pins}
          onClose={() => setPanelOpen(false)}
          onDeleteRequest={(pinId) => {
            setPanelOpen(false)
            setPinPendingDelete(pinId)
          }}
          onViewRevealed={(pinId) => {
            const pin = pins.find((p) => p.id === pinId)
            if (pin) {
              setSkipRevealAnimation(true)
              setRevealModalPin(pin)
              setPanelOpen(false)
            }
          }}
        />
      )}
    </div>
  )
}

function IconButton({
  children, onClick, title, active = false, large = false,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
  large?: boolean
}) {
  const size = large ? 54 : 42
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: size, height: size, borderRadius: '50%',
        border: 'none', flexShrink: 0,
        background: active ? '#e8899e' : '#fffaf3',
        boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
        fontSize: large ? 24 : 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

const topBand: React.CSSProperties = {
  position: 'absolute',
  top: 'max(14px, env(safe-area-inset-top))',
  left: 14, right: 14,
  display: 'flex', flexDirection: 'column', gap: 10,
  zIndex: 10,
}

const topIconRow: React.CSSProperties = {
  display: 'flex', gap: 8,
}

const hintBubble: React.CSSProperties = {
  position: 'absolute', bottom: 96, left: '50%', transform: 'translateX(-50%)',
  background: '#fffaf3', padding: '8px 16px', borderRadius: 20,
  fontSize: 13, color: '#5c4a3a', boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
  zIndex: 15, whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
}

const sheet: React.CSSProperties = {
  position: 'absolute', bottom: 0, left: 0, right: 0,
  background: '#fffaf3', borderTopLeftRadius: 22, borderTopRightRadius: 22,
  boxShadow: '0 -4px 16px rgba(0,0,0,0.12)',
  transition: 'height 0.25s ease',
  display: 'flex', flexDirection: 'column',
  paddingBottom: 'env(safe-area-inset-bottom)',
}

const sheetPeek: React.CSSProperties = {
  width: '100%', padding: '14px 0 10px', background: 'transparent',
  border: 'none', color: '#5c4a3a', fontWeight: 700, cursor: 'pointer',
}

const sheetList: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '0 16px 16px',
  display: 'flex', flexDirection: 'column', gap: 10,
}

const sheetCard: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#fff', padding: '12px 14px', borderRadius: 14,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
}

const revealBtn: React.CSSProperties = {
  padding: '8px 16px', background: '#8fd4a8', border: 'none',
  borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
}

const routeCard: React.CSSProperties = {
  position: 'absolute', left: 14, right: 14, maxWidth: 340, margin: '0 auto',
  background: '#fffaf3', borderRadius: 16, padding: '12px 16px',
  boxShadow: '0 3px 10px rgba(0,0,0,0.18)', zIndex: 20,
  transition: 'bottom 0.2s ease',
}
const navBtn: React.CSSProperties = {
  padding: '8px 14px', background: '#8fd4a8', border: 'none',
  borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', flex: 1,
}
const clearBtn: React.CSSProperties = {
  padding: '8px 12px', background: '#f2e8db', border: 'none',
  borderRadius: 10, color: '#5c4a3a', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
}