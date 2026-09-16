import { describe, expect, it } from 'vitest'

import { devicesToGeoJSON, filterMapDevices, uniqueMapDevices } from '@/lib/map'

const devices = [
  {
    id: 'one',
    name: 'Karachi Central',
    lat: 24.86,
    lon: 67.01,
    is_outdoor: true,
    status: 'online',
    aqi: 80,
  },
  {
    id: 'two',
    name: 'Studio',
    lat: 31.52,
    lon: 74.35,
    is_outdoor: false,
    status: 'offline',
    aqi: 120,
  },
]

describe('devicesToGeoJSON', () => {
  it('uses longitude-latitude GeoJSON order and retains marker properties', () => {
    const data = devicesToGeoJSON(devices)
    expect(data.type).toBe('FeatureCollection')
    expect(data.features[0]).toMatchObject({
      id: 'one',
      geometry: { coordinates: [67.01, 24.86] },
      properties: { aqi: 80 },
    })
  })
})

describe('uniqueMapDevices', () => {
  it('keeps only the newest reading for each device', () => {
    const duplicate = {
      ...devices[0],
      aqi: 140,
      measured_at: '2026-01-02T00:00:00Z',
    }
    const older = {
      ...devices[0],
      aqi: 35,
      measured_at: '2026-01-01T00:00:00Z',
    }

    expect(uniqueMapDevices([older, devices[1], duplicate])).toEqual([duplicate, devices[1]])
  })
})

describe('filterMapDevices', () => {
  it('combines name, placement, and status filters', () => {
    expect(
      filterMapDevices(devices, { query: 'studio', placement: 'indoor', status: 'offline' }).map(
        (device) => device.id,
      ),
    ).toEqual(['two'])
    expect(
      filterMapDevices(devices, { query: '', placement: 'outdoor', status: 'offline' }),
    ).toEqual([])
  })
})
