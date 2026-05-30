'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { Zone } from '@/lib/types'
import { DEFAULT_LOCATION, MAX_DELIVERY_KM, distanceKm, snapToRadius } from '@/lib/utils'

interface MapProps {
  zones?: Zone[]
  selectedLocation?: { lat: number; lng: number } | null
  onClick?: (lat: number, lng: number) => void
  readOnly?: boolean
}

const CENTER = DEFAULT_LOCATION

export default function Map({ zones = [], selectedLocation, onClick, readOnly }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<L.Popup | null>(null)
  const [deliveryRadius, setDeliveryRadius] = useState(MAX_DELIVERY_KM)

  useEffect(() => {
    fetch('/api/settings/radius')
      .then((r) => r.json())
      .then((data) => {
        if (data?.radius) setDeliveryRadius(data.radius)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [CENTER.lat, CENTER.lng],
        zoom: 15,
        zoomControl: !readOnly,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current)
      mapRef.current.invalidateSize()
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [readOnly])

  // Delivery radius circle
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const circle = L.circle([CENTER.lat, CENTER.lng], {
      radius: deliveryRadius * 1000,
      color: '#E65100',
      fillColor: '#E65100',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '8, 8',
    }).addTo(map)

    // Center marker
    const centerMarker = L.marker([CENTER.lat, CENTER.lng], {
      icon: L.divIcon({
        className: 'bg-transparent',
        html: '<span style="font-size:24px">📍</span>',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      }),
      interactive: false,
    }).addTo(map)

    return () => {
      map.removeLayer(circle)
      map.removeLayer(centerMarker)
    }
  }, [readOnly, deliveryRadius])

  // Zone circles
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const circles: L.Circle[] = []
    zones.forEach((zone) => {
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius * 1000,
        color: '#9C4A35',
        fillColor: '#9C4A35',
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(map)

      circle.bindTooltip(zone.name, { sticky: true })
      circles.push(circle)
    })

    return () => {
      circles.forEach((c) => map.removeLayer(c))
    }
  }, [zones])

  // Click handler with distance check
  useEffect(() => {
    const map = mapRef.current
    if (!map || readOnly || !onClick) return

    const handler = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      const dist = distanceKm(lat, lng, CENTER.lat, CENTER.lng)

      // Close previous popup
      if (popupRef.current) {
        map.closePopup(popupRef.current)
        popupRef.current = null
      }

      if (dist > deliveryRadius) {
        popupRef.current = L.popup()
          .setLatLng([lat, lng])
          .setContent(`📍 อยู่นอกรัศมีการจัดส่ง<br/><small>สูงสุด ${deliveryRadius} กม. จากบ้านสูงเนิน</small>`)
          .openOn(map)
        return
      }

      onClick(lat, lng)
    }

    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [onClick, readOnly, deliveryRadius])

  // Selected location marker with drag bound
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let marker: L.Marker | null = null

    if (selectedLocation) {
      marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        draggable: !readOnly,
        icon: L.divIcon({
          className: 'bg-transparent',
          html: '<span style="font-size:24px">📍</span>',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        }),
      }).addTo(map)

      if (!readOnly) {
        marker.on('dragend', () => {
          const pos = marker?.getLatLng()
          if (!pos || !onClick) return

          const dist = distanceKm(pos.lat, pos.lng, CENTER.lat, CENTER.lng)
          if (dist > deliveryRadius) {
            const snapped = snapToRadius(pos.lat, pos.lng, CENTER.lat, CENTER.lng, deliveryRadius)
            marker?.setLatLng([snapped.lat, snapped.lng])
            onClick(snapped.lat, snapped.lng)
            popupRef.current = L.popup()
              .setLatLng([snapped.lat, snapped.lng])
              .setContent(`📍 snap กลับขอบเขตจัดส่ง<br/><small>สูงสุด ${deliveryRadius} กม.</small>`)
              .openOn(map)
          } else {
            onClick(pos.lat, pos.lng)
          }
        })
      }
    }

    return () => {
      if (marker) map.removeLayer(marker)
    }
  }, [selectedLocation, onClick, readOnly, deliveryRadius])

  return <div ref={mapContainerRef} className="w-full h-full" />
}
