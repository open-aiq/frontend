import { useAuth } from '@clerk/react'
import { useMemo } from 'react'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1').replace(
  /\/+$/,
  '',
)

async function request(path, options = {}, getToken) {
  const token = getToken ? await getToken() : null
  const headers = { ...options.headers }
  // Avoid preflighting body-less GET requests. Only advertise JSON when a
  // request actually sends a JSON body.
  if (options.body != null && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.details || body.error || message
    } catch {
      /* keep fallback */
    }
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  if (res.status === 204) return null
  return res.json()
}

export function useApi() {
  const { getToken } = useAuth()
  return useMemo(
    () => ({
      listDevices: async () => (await request('/devices', {}, getToken)).data ?? [],
      registerDevice: async (name) =>
        (await request('/devices', { method: 'POST', body: JSON.stringify({ name }) }, getToken))
          .data,
      updateDevice: async (id, patch) =>
        (
          await request(
            `/devices/${id}`,
            { method: 'PATCH', body: JSON.stringify(patch) },
            getToken,
          )
        ).data,
      rotateDeviceKey: async (id) =>
        (await request(`/devices/${id}/rotate-key`, { method: 'POST' }, getToken)).data,
      deleteDevice: async (id) => request(`/devices/${id}`, { method: 'DELETE' }, getToken),
      getDeviceCurrent: async (id) => (await request(`/devices/${id}/current`, {}, getToken)).data,
      getDeviceHistorical: async (id, timeline) =>
        (
          await request(
            `/devices/${id}/historical?timeline=${encodeURIComponent(timeline)}`,
            {},
            getToken,
          )
        ).data ?? [],
    }),
    [getToken],
  )
}

export async function listPublicDevices() {
  return (await request('/public/devices')).data ?? []
}
export async function getPublicDevice(id) {
  return (await request(`/public/devices/${id}`)).data
}
export async function getPublicDeviceCurrent(id) {
  return (await request(`/public/devices/${id}/current`)).data
}
export async function getPublicDeviceHistorical(id, timeline) {
  return (
    (await request(`/public/devices/${id}/historical?timeline=${encodeURIComponent(timeline)}`))
      .data ?? []
  )
}
export async function listPublicMapDevices() {
  return (await request('/public/map/devices')).data ?? []
}
