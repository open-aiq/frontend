export function uniqueMapDevices(devices) {
  const byId = new Map()

  devices.forEach((device) => {
    const current = byId.get(device.id)
    if (!current || readingTime(device) > readingTime(current)) byId.set(device.id, device)
  })

  return [...byId.values()]
}

function readingTime(device) {
  const timestamp = Date.parse(device.measured_at)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function devicesToGeoJSON(devices) {
  return {
    type: 'FeatureCollection',
    features: devices.map((device) => ({
      type: 'Feature',
      id: device.id,
      geometry: { type: 'Point', coordinates: [device.lon, device.lat] },
      properties: { ...device },
    })),
  }
}

export function filterMapDevices(devices, { query = '', placement = 'all', status = 'all' }) {
  const normalizedQuery = query.trim().toLowerCase()
  return devices.filter((device) => {
    const matchesQuery = device.name.toLowerCase().includes(normalizedQuery)
    const matchesPlacement = placement === 'all' || (placement === 'outdoor') === device.is_outdoor
    return matchesQuery && matchesPlacement && (status === 'all' || status === device.status)
  })
}
