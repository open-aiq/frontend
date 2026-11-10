import { describe, expect, it } from 'vitest'

import { aqiInfo } from './aqi'
import { UNKNOWN } from './aqi-bands.g'
import { hasRecentReadings, recentReadings } from './readings'

// What the backend sends once a monitor has been silent for over an hour.
const silent = {
  aqi: 0,
  pm1_0: 0,
  pm2_5: 0,
  pm10_0: 0,
  temperature: 0,
  humidity: 0,
  heat_index: 0,
  status: 'offline',
  last_seen: '2026-01-01T00:00:00Z',
  sample_count: 0,
  location: null,
}

describe('hasRecentReadings', () => {
  it('is false when there is no reading at all', () => {
    expect(hasRecentReadings(null)).toBe(false)
    expect(hasRecentReadings(undefined)).toBe(false)
  })

  it('is false for the zeroed reading of a silent monitor', () => {
    expect(hasRecentReadings(silent)).toBe(false)
  })

  it('is true when samples were averaged, even if the air is clean', () => {
    expect(hasRecentReadings({ ...silent, status: 'online', sample_count: 58, aqi: 32 })).toBe(true)
    expect(hasRecentReadings({ ...silent, status: 'online', sample_count: 3 })).toBe(true)
  })

  it('treats a missing sample count as data', () => {
    expect(hasRecentReadings({ aqi: 12 })).toBe(true)
  })
})

describe('recentReadings', () => {
  it('passes a real reading through unchanged', () => {
    const reading = { ...silent, sample_count: 4, aqi: 78 }
    expect(recentReadings(reading)).toBe(reading)
  })

  it('returns null for a missing or empty reading', () => {
    expect(recentReadings(null)).toBeNull()
    expect(recentReadings(silent)).toBeNull()
  })

  it('keeps a silent monitor on the unknown band, never "Good"', () => {
    expect(aqiInfo(silent.aqi).label).toBe('Good')
    expect(aqiInfo(recentReadings(silent)?.aqi)).toBe(UNKNOWN)
  })
})
