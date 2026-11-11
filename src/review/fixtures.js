// Mock data for `make review`. Shapes match the backend's swagger models
// (device.Device, airquality.CurrentAirQuality, airquality.DataPoint, and the
// public map device). Timestamps are relative to now so charts and "last
// seen" labels look current.

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const iso = (ms) => new Date(ms).toISOString()

// One device per AQI band, plus one that hasn't reported yet. IDs are UUIDv4,
// as the backend issues them; `key` is a readable handle for review code.
const SEEDS = [
  {
    key: 'garden',
    id: 'a5f5928f-3d13-4c49-a99a-a58dcab35aed',
    name: 'Back garden',
    aqi: 32,
    outdoor: true,
    public: true,
    location: true,
    lat: -33.8688,
    lon: 151.2093,
  },
  {
    key: 'kitchen',
    id: '4f036a14-7e7c-492c-8191-08606c056c69',
    name: 'Kitchen',
    aqi: 78,
    outdoor: false,
    public: false,
    location: false,
  },
  {
    key: 'balcony',
    id: '492362d9-5987-4448-b5b7-378aad8f581b',
    name: 'Balcony',
    aqi: 128,
    outdoor: true,
    public: true,
    location: true,
    lat: -33.8915,
    lon: 151.2767,
  },
  {
    key: 'school',
    id: 'cb9dc2ff-c626-435a-a7ce-315ce657025c',
    name: 'School gate',
    aqi: 172,
    outdoor: true,
    public: true,
    location: true,
    lat: -33.8523,
    lon: 151.1802,
  },
  {
    key: 'workshop',
    id: 'a09f71cd-ffcc-46d9-bb0c-3ee02f5b9e74',
    name: 'Workshop',
    aqi: 240,
    outdoor: false,
    public: true,
    location: false,
  },
  {
    key: 'bushfire',
    id: 'c04a0342-3245-4770-b54d-726aee1d7fa1',
    name: 'Ridge lookout',
    aqi: 340,
    outdoor: true,
    public: true,
    location: true,
    lat: -33.7969,
    lon: 151.2878,
    offline: true,
  },
  {
    key: 'new',
    id: 'c722c548-62c7-4d8b-807a-2306b38c6ed1',
    name: 'New sensor',
    aqi: null,
    outdoor: false,
    public: false,
    location: false,
  },
]

// pm25ForAqi roughly inverts the US EPA breakpoints, close enough for review.
function pm25ForAqi(aqi) {
  if (aqi <= 50) return (aqi / 50) * 9
  if (aqi <= 100) return 9 + ((aqi - 50) / 50) * 26.4
  if (aqi <= 150) return 35.5 + ((aqi - 100) / 50) * 20
  if (aqi <= 200) return 55.5 + ((aqi - 150) / 50) * 69.9
  if (aqi <= 300) return 125.5 + ((aqi - 200) / 100) * 99.9
  return 225.5 + ((aqi - 300) / 200) * 99.9
}

// DEVICE_IDS maps each seed's key to its ID, e.g. DEVICE_IDS.garden.
export const DEVICE_IDS = Object.fromEntries(SEEDS.map((seed) => [seed.key, seed.id]))

// An ID no device has, for the not-found states.
export const MISSING_DEVICE_ID = 'f5d8c9b4-5cfb-4910-85da-9c870dfb651f'

export function makeDevices() {
  const created = Date.now() - 90 * DAY
  return SEEDS.map((seed, index) => ({
    id: seed.id,
    device_id: `dev_${seed.id.replaceAll('-', '')}`,
    name: seed.name,
    is_public: seed.public,
    is_outdoor: seed.outdoor,
    is_location_public: seed.location,
    firmware_version: index % 3 === 0 ? '0.6.2' : '0.6.1',
    ota: null,
    created_at: iso(created + index * DAY),
    updated_at: iso(Date.now() - index * HOUR),
  }))
}

export function isKnownDevice(id) {
  return SEEDS.some((seed) => seed.id === id)
}

export function hasReadings(id) {
  return SEEDS.find((seed) => seed.id === id)?.aqi != null
}

export function makeCurrent(id, { offline = false } = {}) {
  const seed = SEEDS.find((item) => item.id === id)
  if (!seed || seed.aqi == null) return null
  const isOffline = offline || seed.offline
  const pm25 = pm25ForAqi(seed.aqi)
  const temperature = seed.outdoor ? 18.4 + (seed.aqi % 7) : 22.1
  const humidity = seed.outdoor ? 64 : 46
  return {
    aqi: seed.aqi,
    pm1_0: pm25 * 0.68,
    pm2_5: pm25,
    pm10_0: pm25 * 1.42,
    temperature,
    humidity,
    heat_index: temperature + 0.6,
    status: isOffline ? 'offline' : 'online',
    last_seen: iso(Date.now() - (isOffline ? 3 * HOUR + 12 * MINUTE : 2 * MINUTE)),
    sample_count: isOffline ? 4 : 58,
    location: seed.location ? seedLocation(seed) : null,
  }
}

// seedLocation matches the backend's airquality.Location: fixes come from the
// mobile app, with the time they were taken.
function seedLocation(seed) {
  return { lat: seed.lat, lon: seed.lon, provider: 'mobile', timestamp: iso(Date.now() - 2 * DAY) }
}

const TIMELINES = {
  daily: { step: HOUR, count: 24, label: (d) => d.toISOString().slice(11, 16) },
  weekly: { step: DAY, count: 7, label: (d) => d.toISOString().slice(5, 10) },
  monthly: { step: DAY, count: 30, label: (d) => d.toISOString().slice(5, 10) },
  yearly: { step: 30 * DAY, count: 12, label: (d) => d.toISOString().slice(0, 7) },
}

// makeHistory returns a gentle wave around the device's AQI, with a short gap
// so the chart's missing-data rendering is visible.
export function makeHistory(id, timeline) {
  const seed = SEEDS.find((item) => item.id === id)
  const config = TIMELINES[timeline] ?? TIMELINES.daily
  if (!seed || seed.aqi == null) return []
  const end = Math.floor(Date.now() / config.step) * config.step
  const points = []
  for (let i = config.count - 1; i >= 0; i -= 1) {
    if (i === Math.floor(config.count / 3) || i === Math.floor(config.count / 3) + 1) continue
    const start = new Date(end - i * config.step)
    const wave = Math.sin((config.count - i) / 3) * 0.25 + Math.cos(i / 5) * 0.1
    const aqi = Math.max(1, Math.round(seed.aqi * (1 + wave)))
    const pm25 = pm25ForAqi(aqi)
    const temperature = 17 + Math.sin(i / 4) * 5
    points.push({
      timestamp: start.toISOString(),
      label: config.label(start),
      metrics: {
        aqi,
        pm1_0: pm25 * 0.68,
        pm2_5: pm25,
        pm10_0: pm25 * 1.42,
        temperature,
        humidity: 55 + Math.cos(i / 3) * 12,
        heat_index: temperature + 0.5,
      },
    })
  }
  return points
}

export function makePublicDevice(id) {
  const device = makeDevices().find((item) => item.id === id && item.is_public)
  if (!device) return null
  const { name, is_outdoor, is_public, created_at, updated_at } = device
  return { id, name, is_outdoor, is_public, created_at, updated_at }
}

export function makeMapDevices({ offline = false } = {}) {
  return SEEDS.filter((seed) => seed.public && seed.location && seed.aqi != null).map((seed) => {
    const current = makeCurrent(seed.id, { offline })
    return {
      id: seed.id,
      name: seed.name,
      lat: seed.lat,
      lon: seed.lon,
      is_outdoor: seed.outdoor,
      status: current.status,
      aqi: current.aqi,
      pm2_5: current.pm2_5,
      temperature: current.temperature,
      measured_at: current.last_seen,
    }
  })
}
