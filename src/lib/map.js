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
