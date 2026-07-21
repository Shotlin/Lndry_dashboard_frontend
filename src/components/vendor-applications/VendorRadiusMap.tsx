"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const shopIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
      <path d="M15 0C6.72 0 0 6.72 0 15c0 11.25 15 23 15 23s15-11.75 15-23C30 6.72 23.28 0 15 0z" fill="#4F46E5" stroke="#fff" stroke-width="2"/>
      <circle cx="15" cy="14" r="6.5" fill="#fff"/>
      <circle cx="15" cy="14" r="4" fill="#4F46E5"/>
    </svg>
  `),
  iconSize: [30, 38],
  iconAnchor: [15, 38],
})

/** Keeps the map framed on the coverage circle whenever the radius changes. */
function FitToCircle({ center, radiusMeters }: { center: [number, number]; radiusMeters: number }) {
  const map = useMap()
  useEffect(() => {
    // The container's real size isn't measured yet on first mount inside a
    // flex/grid layout, so fitBounds's zoom math runs against a 0x0 size and
    // picks a bogus (max) zoom — invalidateSize forces Leaflet to remeasure first.
    map.invalidateSize()
    // toBounds() computes a real-world-meters bounding box directly from the
    // LatLng (proper lat-dependent degree conversion) — unlike L.circle(...).getBounds(),
    // it doesn't require the layer to already be attached to a map.
    const bounds = L.latLng(center).toBounds(radiusMeters * 2)
    map.fitBounds(bounds, { padding: [24, 24] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], radiusMeters, map])
  return null
}

interface VendorRadiusMapProps {
  lat: number
  lng: number
  radiusKm: number
}

/**
 * Shows the vendor's exact pin plus a coverage circle sized to the service
 * radius (in real-world meters, geodesically correct — not a CSS circle),
 * so admins can see at a glance how far the approved/requested radius
 * actually reaches on the ground.
 */
export function VendorRadiusMap({ lat, lng, radiusKm }: VendorRadiusMapProps) {
  const center = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);
  const radiusMeters = radiusKm * 1000

  return (
    <div className="rounded-xl overflow-hidden border border-[#e8e8ef]" style={{ height: 320 }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitToCircle center={center} radiusMeters={radiusMeters} />
        <Circle
          center={center}
          radius={radiusMeters}
          pathOptions={{
            color: "#4F46E5",
            weight: 2,
            fillColor: "#6366F1",
            fillOpacity: 0.18,
          }}
        />
        <Marker position={center} icon={shopIcon} />
      </MapContainer>
    </div>
  )
}
