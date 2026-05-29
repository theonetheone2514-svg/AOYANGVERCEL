import { describe, it, expect } from 'vitest'
import { formatPrice, calculateCommission, netAfterCommission, isInZone, distanceKm, snapToRadius, getStatusColor, getElapsedMinutes } from './utils'

describe('formatPrice', () => {
  it('formats price with two decimals', () => {
    expect(formatPrice(50)).toBe('50.00 บาท')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('0.00 บาท')
  })
})

describe('calculateCommission', () => {
  it('calculates 15% commission', () => {
    expect(calculateCommission(100, 0.15)).toBe(15)
  })

  it('rounds to 2 decimals', () => {
    expect(calculateCommission(99, 0.15)).toBe(14.85)
  })
})

describe('netAfterCommission', () => {
  it('calculates net income correctly', () => {
    expect(netAfterCommission(100, 10, 0.15)).toBe(95)
  })
})

describe('isInZone', () => {
  const center = { lat: 17.293067, lng: 103.969910 }

  it('returns true for a point at the center', () => {
    expect(isInZone(center.lat, center.lng, center.lat, center.lng, 5)).toBe(true)
  })

  it('returns true for a close point (~2km away)', () => {
    expect(isInZone(17.31, 103.97, center.lat, center.lng, 5)).toBe(true)
  })

  it('returns false for a far point (~100km away)', () => {
    expect(isInZone(18.0, 104.0, center.lat, center.lng, 5)).toBe(false)
  })
})

describe('distanceKm', () => {
  it('returns 0 for same point', () => {
    expect(distanceKm(17.293067, 103.969910, 17.293067, 103.969910)).toBeCloseTo(0, 2)
  })

  it('returns positive distance', () => {
    const d = distanceKm(17.293067, 103.969910, 17.31, 103.97)
    expect(d).toBeGreaterThan(0)
  })
})

describe('snapToRadius', () => {
  const center = { lat: 17.293067, lng: 103.969910 }

  it('keeps point within radius unchanged', () => {
    const snapped = snapToRadius(17.31, 103.97, center.lat, center.lng, 5)
    expect(snapped.lat).toBeCloseTo(17.31, 4)
    expect(snapped.lng).toBeCloseTo(103.97, 4)
  })

  it('snaps far point to edge of radius', () => {
    const snapped = snapToRadius(18.0, 104.0, center.lat, center.lng, 5)
    const dist = distanceKm(snapped.lat, snapped.lng, center.lat, center.lng)
    expect(dist).toBeCloseTo(5, 0)
  })
})

describe('getStatusColor', () => {
  it('returns correct color for pending status', () => {
    expect(getStatusColor('รอดำเนินการ')).toContain('bg-yellow-100')
  })

  it('returns default for unknown status', () => {
    expect(getStatusColor('unknown')).toContain('bg-gray-100')
  })
})

describe('getElapsedMinutes', () => {
  it('returns 0 for current time', () => {
    expect(getElapsedMinutes(new Date().toISOString())).toBe(0)
  })

  it('returns positive for past time', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(getElapsedMinutes(fiveMinAgo)).toBeGreaterThanOrEqual(4)
    expect(getElapsedMinutes(fiveMinAgo)).toBeLessThanOrEqual(6)
  })
})
