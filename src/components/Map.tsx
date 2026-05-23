'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Zone } from '@/lib/types'

interface MapProps {
  zones?: Zone[]
  selectedLocation?: { lat: number; lng: number } | null
  onClick?: (lat: number, lng: number) => void
  readOnly?: boolean
}

export default function Map({ zones = [], selectedLocation, onClick, readOnly }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [14.0, 100.0],
        zoom: 13,
        zoomControl: !readOnly,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [readOnly])

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

  // Click handler
  useEffect(() => {
    const map = mapRef.current
    if (!map || readOnly || !onClick) return

    const handler = (e: L.LeafletMouseEvent) => {
      onClick(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [onClick, readOnly])

  // Selected location marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let marker: L.Marker | null = null

    if (selectedLocation) {
      marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        draggable: !readOnly,
      }).addTo(map)

      if (!readOnly) {
        marker.on('dragend', () => {
          const pos = marker?.getLatLng()
          if (pos && onClick) onClick(pos.lat, pos.lng)
        })
      }
    }

    return () => {
      if (marker) map.removeLayer(marker)
    }
  }, [selectedLocation, onClick, readOnly])

  return <div ref={mapContainerRef} className="w-full h-full" />
}
