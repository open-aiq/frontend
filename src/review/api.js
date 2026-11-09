// Review-mode stand-in for src/lib/api.js. vite.config.js aliases `@/lib/api`
// to this file only under `--mode review`, so production builds never see it.
// It exports the same functions, answers from fixtures, and follows the
// active scenario (see scenario.js).
import { useMemo } from 'react'

// A relative import reaches the real module; the exact-match alias only
// rewrites `@/lib/api`.
import { ApiError, apiErrorFromBody } from '../lib/api.js'
import {
  hasReadings,
  makeCurrent,
  makeDevices,
  makeHistory,
  makeMapDevices,
  makePublicDevice,
} from './fixtures.js'
import { getScenario } from './scenario.js'

export { ApiError, apiErrorFromBody }

const LATENCY_MS = 400
const scenario = getScenario()

// In-memory devices so renames, toggles and deletes stick until a reload.
let devices = scenario === 'empty' ? [] : makeDevices()

const notFound = () =>
  apiErrorFromBody(404, {
    type: 'https://docs.air-iq.net/problems/not-found',
    title: 'Not Found',
    status: 404,
    detail: 'No readings found for this device.',
  })

function respond(produce) {
  if (scenario === 'loading') return new Promise(() => {})
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (scenario === 'error') {
        reject(
          apiErrorFromBody(500, {
            type: 'https://docs.air-iq.net/problems/internal',
            title: 'Internal Server Error',
            status: 500,
            detail: 'Review mode: simulated server error.',
          }),
        )
        return
      }
      try {
        resolve(produce())
      } catch (err) {
        reject(err)
      }
    }, LATENCY_MS)
  })
}

function current(id) {
  if (scenario === 'no-data' || !hasReadings(id)) throw notFound()
  return makeCurrent(id, { offline: scenario === 'offline' })
}

function history(id, timeline) {
  if (scenario === 'no-data') return []
  return makeHistory(id, timeline)
}

export function useApi() {
  return useMemo(
    () => ({
      listDevices: () => respond(() => devices.map((device) => ({ ...device }))),
      updateDevice: (id, patch) =>
        respond(() => {
          const index = devices.findIndex((device) => device.id === id)
          if (index < 0) throw notFound()
          devices[index] = { ...devices[index], ...patch, updated_at: new Date().toISOString() }
          return { ...devices[index] }
        }),
      deleteDevice: (id) =>
        respond(() => {
          devices = devices.filter((device) => device.id !== id)
          return null
        }),
      getDeviceCurrent: (id) => respond(() => current(id)),
      getDeviceHistorical: (id, timeline) => respond(() => history(id, timeline)),
    }),
    [],
  )
}

export function listPublicDevices() {
  return respond(() =>
    scenario === 'empty' ? [] : devices.filter((device) => device.is_public).map(makePublicLike),
  )
}

function makePublicLike({ id, name, is_outdoor, is_public, created_at, updated_at }) {
  return { id, name, is_outdoor, is_public, created_at, updated_at }
}

export function getPublicDevice(id) {
  return respond(() => {
    const device = scenario === 'empty' ? null : makePublicDevice(id)
    if (!device) throw notFound()
    return device
  })
}

export function getPublicDeviceCurrent(id) {
  return respond(() => current(id))
}

export function getPublicDeviceHistorical(id, timeline) {
  return respond(() => history(id, timeline))
}

export function listPublicMapDevices() {
  return respond(() =>
    scenario === 'empty' || scenario === 'no-data'
      ? []
      : makeMapDevices({ offline: scenario === 'offline' }),
  )
}
