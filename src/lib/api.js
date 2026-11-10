import { useAuth } from '@clerk/react'
import { useMemo } from 'react'

// Set per build in .env.production; there's no local-backend fallback.
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(status, body = {}) {
    const message =
      body.detail || body.details || body.title || body.error || `Request failed (${status})`
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.type = body.type ?? null
    this.title = body.title ?? null
    this.detail = body.detail ?? body.details ?? null
    this.instance = body.instance ?? null
    this.errors = Array.isArray(body.errors) ? body.errors : []
  }

  fieldError(location, name) {
    return this.errors.find((item) => item.in === location && item.name === name) ?? null
  }
}

export function apiErrorFromBody(status, body) {
  return new ApiError(status, body && typeof body === 'object' ? body : {})
}

async function request(path, options = {}, getToken) {
  if (!BASE_URL) throw new Error('Missing VITE_API_URL')
  const token = getToken ? await getToken() : null
  const headers = { ...options.headers }
  // Avoid preflighting body-less GET requests. Only advertise JSON when a
  // request actually sends a JSON body.
  if (options.body != null && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    let body = null
    try {
      body = await res.json()
    } catch {
      /* keep fallback */
    }
    throw apiErrorFromBody(res.status, body)
  }
  if (res.status === 204) return null
  return res.json()
}

export function useApi() {
  const { getToken } = useAuth()
  return useMemo(
    () => ({
      listDevices: async () => (await request('/devices', {}, getToken)).data ?? [],
      updateDevice: async (id, patch) =>
        (
          await request(
            `/devices/${id}`,
            { method: 'PATCH', body: JSON.stringify(patch) },
            getToken,
          )
        ).data,
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
      // Deletes every monitor you own (with its readings, logs and updates),
      // then your sign-in. Answers 204 No Content.
      deleteAccount: async () => request('/account', { method: 'DELETE' }, getToken),
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
