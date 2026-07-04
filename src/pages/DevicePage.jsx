import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CloudOff, Loader2, ServerCrash, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DeviceFlags, StatusBadge, deviceFlags } from '@/components/DeviceCard'
import { HistoryChart } from '@/components/HistoryChart'
import { ThemeToggle } from '@/components/ThemeToggle'
import { getDeviceCurrent, getDeviceHistorical, listDevices } from '@/lib/api'
import { aqiInfo } from '@/lib/aqi'

const TIMELINES = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const METRICS = [
  { key: 'aqi', label: 'AQI' },
  { key: 'pm2_5', label: 'PM2.5' },
  { key: 'temperature', label: 'Temperature' },
]

function formatLastSeen(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Metric({ label, value, unit }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-medium tabular-nums">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  )
}

export function DevicePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [device, setDevice] = useState(null)
  const [deviceState, setDeviceState] = useState('loading') // 'loading' | 'ready' | 'error'
  const [current, setCurrent] = useState(null)
  const [currentState, setCurrentState] = useState('loading') // 'loading' | 'ready' | 'nodata' | 'error'
  const [timeline, setTimeline] = useState('daily')
  const [metricKey, setMetricKey] = useState('aqi')
  const [points, setPoints] = useState([])
  const [historyState, setHistoryState] = useState('loading') // 'loading' | 'ready' | 'error'

  // There is no GET /devices/{id}; resolve the device from the list.
  const loadDevice = useCallback(async () => {
    setDeviceState('loading')
    try {
      const devices = await listDevices()
      const found = devices.find((d) => d.id === id)
      setDevice(found ?? null)
      setDeviceState(found ? 'ready' : 'error')
    } catch {
      setDeviceState('error')
    }
  }, [id])

  useEffect(() => {
    loadDevice()
  }, [loadDevice])

  useEffect(() => {
    let cancelled = false
    setCurrentState('loading')
    getDeviceCurrent(id)
      .then((data) => {
        if (cancelled) return
        setCurrent(data)
        setCurrentState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setCurrentState(err.status === 404 ? 'nodata' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    let cancelled = false
    setHistoryState('loading')
    getDeviceHistorical(id, timeline)
      .then((data) => {
        if (cancelled) return
        setPoints(data)
        setHistoryState('ready')
      })
      .catch(() => {
        if (cancelled) return
        setHistoryState('error')
      })
    return () => {
      cancelled = true
    }
  }, [id, timeline])

  const aqi = current ? aqiInfo(current.aqi) : null

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Devices
            </Link>
            {deviceState === 'ready' && device && (
              <>
                <div className="mt-2 flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight">{device.name}</h1>
                  <DeviceFlags device={device} />
                </div>
                <p className="font-mono text-xs text-muted-foreground">{device.device_id}</p>
              </>
            )}
            {deviceState === 'loading' && (
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-muted-foreground">
                Loading…
              </h1>
            )}
            {deviceState === 'error' && (
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Device not found</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => navigate(`/devices/${id}/settings`)}
              aria-label="Device settings"
            >
              <Settings className="size-4" /> Settings
            </Button>
          </div>
        </header>

        <main className="mt-8 space-y-6">
          {/* Section 1 — current data */}
          <Card>
            <CardHeader>
              <CardTitle>Current</CardTitle>
              <CardDescription>Averages over the last hour</CardDescription>
            </CardHeader>
            <CardContent>
              {currentState === 'loading' && (
                <div className="flex items-center gap-3 py-8 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  <p className="text-sm">Loading current data…</p>
                </div>
              )}

              {currentState === 'nodata' && (
                <div className="flex items-center gap-3 py-8 text-muted-foreground">
                  <CloudOff className="size-5" />
                  <p className="text-sm">No data yet — this device hasn’t reported a reading.</p>
                </div>
              )}

              {currentState === 'error' && (
                <div className="flex items-center gap-3 py-8 text-muted-foreground">
                  <ServerCrash className="size-5" />
                  <p className="text-sm">Couldn’t load current data.</p>
                </div>
              )}

              {currentState === 'ready' && current && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <StatusBadge status={current.status} />
                      <span className="text-xs text-muted-foreground">
                        Last seen {formatLastSeen(current.last_seen)}
                      </span>
                    </div>
                    {device && (
                      <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
                        {deviceFlags(device).map(({ icon: Icon, label, description }) => (
                          <span key={label} className="inline-flex items-center gap-1.5 text-xs">
                            <Icon className="size-3.5 text-muted-foreground" />
                            <span className="font-medium">{label}</span>
                            <span className="text-muted-foreground">· {description}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                    <div
                      className="flex w-fit flex-col rounded-2xl px-5 py-4"
                      style={{ backgroundColor: aqi.bg, color: aqi.fg }}
                    >
                      <span className="text-6xl leading-none font-semibold">{current.aqi}</span>
                      <span className="mt-1 text-sm font-medium">US AQI · {aqi.label}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                      <Metric label="PM1.0" value={current.pm1_0.toFixed(1)} unit="µg/m³" />
                      <Metric label="PM2.5" value={current.pm2_5.toFixed(1)} unit="µg/m³" />
                      <Metric label="PM10" value={current.pm10_0.toFixed(1)} unit="µg/m³" />
                      <Metric label="Temperature" value={current.temperature.toFixed(1)} unit="°C" />
                      <Metric label="Humidity" value={current.humidity.toFixed(0)} unit="%" />
                      <Metric label="Heat index" value={current.heat_index.toFixed(1)} unit="°C" />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Based on {current.sample_count} sample{current.sample_count === 1 ? '' : 's'} in
                    the last hour
                    {current.location &&
                      ` · location ${current.location.lat.toFixed(4)}, ${current.location.lon.toFixed(4)} (${current.location.provider})`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2 — history */}
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>
                {METRICS.find((m) => m.key === metricKey).label} over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1">
                  {TIMELINES.map(({ value, label }) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={timeline === value ? 'secondary' : 'ghost'}
                      onClick={() => setTimeline(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {METRICS.map(({ key, label }) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={metricKey === key ? 'secondary' : 'ghost'}
                      onClick={() => setMetricKey(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {historyState === 'loading' && (
                <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              )}

              {historyState === 'error' && (
                <div className="flex h-[280px] items-center justify-center gap-3 text-muted-foreground">
                  <ServerCrash className="size-5" />
                  <p className="text-sm">Couldn’t load history.</p>
                </div>
              )}

              {historyState === 'ready' && points.length === 0 && (
                <div className="flex h-[280px] items-center justify-center gap-3 text-muted-foreground">
                  <CloudOff className="size-5" />
                  <p className="text-sm">No data for this range.</p>
                </div>
              )}

              {historyState === 'ready' && points.length > 0 && (
                <HistoryChart points={points} metricKey={metricKey} />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
