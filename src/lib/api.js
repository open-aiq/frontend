// Trailing slashes are stripped so `${BASE_URL}/devices` never becomes `//devices`.
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1').replace(/\/+$/, '')

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.details || body.error || message
    } catch {
      // response had no JSON body — keep the default message
    }
    // Expose the status so callers can tell "no data yet" (404) from real failures.
    const error = new Error(message)
    error.status = res.status
    throw error
  }

  if (res.status === 204) return null
  return res.json()
}

// GET /devices → Device[] ({ id, device_id, name, created_at, updated_at })
export async function listDevices() {
  const body = await request('/devices')
  return body.data ?? []
}

// POST /devices → CreatedDevice (includes the one-time device_key)
export async function registerDevice(name) {
  const body = await request('/devices', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return body.data
}

// PATCH /devices/{id} — partial update; patch: { name?, is_outdoor?, is_public? }
export async function updateDevice(id, patch) {
  const body = await request(`/devices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return body.data
}

// POST /devices/{id}/rotate-key → device with the new one-time device_key
export async function rotateDeviceKey(id) {
  const body = await request(`/devices/${id}/rotate-key`, { method: 'POST' })
  return body.data
}

// DELETE /devices/{id}
export async function deleteDevice(id) {
  await request(`/devices/${id}`, { method: 'DELETE' })
}

// GET /devices/{id}/current → last-hour averages + status/last_seen/location.
// Throws with err.status === 404 when the device has never reported.
export async function getDeviceCurrent(id) {
  const body = await request(`/devices/${id}/current`)
  return body.data
}

// GET /devices/{id}/historical?timeline= → DataPoint[] ({ timestamp, label, metrics })
export async function getDeviceHistorical(id, timeline) {
  const body = await request(`/devices/${id}/historical?timeline=${encodeURIComponent(timeline)}`)
  return body.data ?? []
}
