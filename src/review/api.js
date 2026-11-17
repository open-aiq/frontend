// Review-mode stand-in for src/lib/api.js. vite.config.js aliases `@/lib/api`
// to this file only under `--mode review`, so production builds never see it.
// It exports the same functions, answers from fixtures, and follows the
// active scenario (see scenario.js).
import { useMemo } from 'react'

// A relative import reaches the real module; the exact-match alias only
// rewrites `@/lib/api`.
import { ApiError, apiErrorFromBody } from '../lib/api.js'
import { PROBLEM } from '../lib/errors.js'
import {
  hasReadings,
  isKnownDevice,
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

// The same problems the backend sends (backend/internal/platform/problem).
const deviceNotFound = () =>
  apiErrorFromBody(404, {
    type: PROBLEM.notFound,
    title: 'Resource not found',
    status: 404,
    detail: 'Device not found.',
  })

const noReadings = () =>
  apiErrorFromBody(404, {
    type: PROBLEM.noReadings,
    title: 'No readings available',
    status: 404,
    detail: 'No readings received yet.',
  })

const invalidId = () =>
  apiErrorFromBody(422, {
    type: PROBLEM.validation,
    title: 'Request validation failed',
    status: 422,
    detail: 'One or more path parameters are invalid.',
    errors: [{ in: 'path', name: 'id', code: 'format', detail: 'id must be a UUIDv4' }],
  })

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// checkId rejects an ID the way the backend does before it looks anything up.
function checkId(id) {
  if (!UUID_V4.test(id)) throw invalidId()
}

function respond(produce) {
  if (scenario === 'loading') return new Promise(() => {})
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (scenario === 'error') {
        reject(
          apiErrorFromBody(500, {
            type: PROBLEM.internal,
            title: 'Internal server error',
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
  checkId(id)
  if (!isKnownDevice(id) || !devices.some((device) => device.id === id)) throw deviceNotFound()
  if (scenario === 'no-data' || !hasReadings(id)) throw noReadings()
  return makeCurrent(id, { offline: scenario === 'offline' })
}

function history(id, timeline) {
  checkId(id)
  if (scenario === 'no-data') return []
  return makeHistory(id, timeline)
}

export function useApi() {
  return useMemo(
    () => ({
      listDevices: () => respond(() => devices.map((device) => ({ ...device }))),
      updateDevice: (id, patch) =>
        respond(() => {
          checkId(id)
          const index = devices.findIndex((device) => device.id === id)
          if (index < 0) throw deviceNotFound()
          devices[index] = { ...devices[index], ...patch, updated_at: new Date().toISOString() }
          return { ...devices[index] }
        }),
      deleteDevice: (id) =>
        respond(() => {
          devices = devices.filter((device) => device.id !== id)
          return null
        }),
      deleteAccount: () =>
        respond(() => {
          devices = []
          return null
        }),
      getDeviceCurrent: (id) => respond(() => current(id)),
      getDeviceHistorical: (id, timeline) => respond(() => history(id, timeline)),
    }),
    [],
  )
}

export function getPublicDevice(id) {
  return respond(() => {
    checkId(id)
    const device = scenario === 'empty' ? null : makePublicDevice(id)
    if (!device) throw deviceNotFound()
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
