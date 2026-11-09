// Mock data for `make review`. Shapes match the backend's swagger models
// (device.Device, airquality.CurrentAirQuality, airquality.DataPoint, and the
// public map device). Timestamps are relative to now so charts and "last
// seen" labels look current.

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const iso = (ms) => new Date(ms).toISOString()

// One device per AQI band, plus one that hasn't reported yet.
const SEEDS = [
  {
    id: 'dev-garden',
    name: 'Back garden',
    aqi: 32,
    outdoor: true,
    public: true,
    location: true,
    lat: -33.8688,
    lon: 151.2093,
  },
  {
    id: 'dev-kitchen',
    name: 'Kitchen',
    aqi: 78,
    outdoor: false,
    public: false,
    location: false,
  },
  {
    id: 'dev-balcony',
    name: 'Balcony',
    aqi: 128,
    outdoor: true,
    public: true,
    location: true,
    lat: -33.8915,
    lon: 151.2767,
  },
  {
    id: 'dev-school',
    name: 'School gate',
    aqi: 172,
    outdoor: true,
    public: true,
    location: true,
    lat: -33.8523,
    lon: 151.1802,
  },
  {
    id: 'dev-workshop',
    name: 'Workshop',
    aqi: 240,
    outdoor: false,
    public: true,
    location: false,
  },
  {
    id: 'dev-bushfire',
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
    id: 'dev-new',
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

export function makeDevices() {
  const created = Date.now() - 90 * DAY
  return SEEDS.map((seed, index) => ({
    id: seed.id,
    device_id: `dev_${seed.id.replace('dev-', '').padEnd(12, '0')}a1b2c3d4e5f6`,
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
    location: seed.location ? { lat: seed.lat, lon: seed.lon, provider: 'phone' } : null,
  }
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
