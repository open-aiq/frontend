import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Settings } from 'lucide-react'

import { AppShell } from '@/components/AppShell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HistoryChart } from '@/components/HistoryChart'
import { DeviceFacts } from '@/components/DeviceFacts'
import { MonitorReadings } from '@/components/readings'
import { EmptyState, ErrorState } from '@/components/states'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/lib/api'
import { shortAgo } from '@/lib/format'
import { hasRecentReadings } from '@/lib/readings'
import { errorKind } from '@/lib/errors'

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

export function DevicePage() {
  const { getDeviceCurrent, getDeviceHistorical, listDevices } = useApi()
  const { id } = useParams()
  const navigate = useNavigate()

  const [device, setDevice] = useState(null)
  const [deviceState, setDeviceState] = useState('loading') // 'loading' | 'ready' | 'missing' | 'error'
  const [current, setCurrent] = useState(null)
  const [currentState, setCurrentState] = useState('loading') // 'loading' | 'ready' | 'nodata' | 'missing' | 'error'
  const [timeline, setTimeline] = useState('daily')
  const [metricKey, setMetricKey] = useState('aqi')
  const [points, setPoints] = useState([])
  const [historyState, setHistoryState] = useState('loading') // 'loading' | 'ready' | 'error'
  // Bumping this fetches the readings and history again after a failure.
  const [reloadKey, setReloadKey] = useState(0)

  // There is no GET /devices/{id}; resolve the device from the list.
  const loadDevice = useCallback(async () => {
    setDeviceState('loading')
    try {
      const devices = await listDevices()
      const found = devices.find((d) => d.id === id)
      setDevice(found ?? null)
      // The list loaded and the device isn't in it: it's gone, not a hiccup.
      setDeviceState(found ? 'ready' : 'missing')
    } catch {
      setDeviceState('error')
    }
  }, [id, listDevices])

  const retryReadings = () => setReloadKey((key) => key + 1)
  const retryAll = () => {
    loadDevice()
    retryReadings()
  }

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
        const kind = errorKind(err)
        setCurrentState(
          kind === 'no-readings' ? 'nodata' : kind === 'not-found' ? 'missing' : 'error',
        )
      })
    return () => {
      cancelled = true
    }
  }, [getDeviceCurrent, id, reloadKey])

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
  }, [getDeviceHistorical, id, timeline, reloadKey])

  const missing = deviceState === 'missing' || currentState === 'missing'

  if (missing || deviceState === 'error') {
    return (
      <AppShell
        backTo="/app"
        backLabel="Back to my monitors"
        title={missing ? 'We couldn’t find this device' : 'We couldn’t load this device'}
      >
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="surface-raised">
            {missing ? (
              <EmptyState
                title="We couldn’t find this device"
                action={
                  <Link
                    to="/app"
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    Back to your devices
                  </Link>
                }
              >
                It may have been removed, or the link is out of date.
              </EmptyState>
            ) : (
              <ErrorState
                title="We couldn’t load this device"
                onRetry={retryAll}
              />
            )}
          </div>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell
      backTo="/app"
      backLabel="Back to my monitors"
      title={
        deviceState === 'ready' && device ? (
          device.name
        ) : (
          <span className="text-muted-foreground">Loading device…</span>
        )
      }
    >
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => navigate(`/app/devices/${id}/settings`)}
          >
            <Settings className="size-4" /> Device settings
          </Button>
        </div>
        {/* Section 1 — current data */}
        <Card>
          <CardHeader>
            <CardTitle>Current</CardTitle>
            <CardDescription>Averages over the last hour</CardDescription>
          </CardHeader>
          <CardContent>
            {currentState === 'loading' && <MonitorReadings loading />}

            {currentState === 'nodata' && (
              <EmptyState title="Waiting for the first reading">
                Once your monitor is online and sending data, its readings show up here. This
                usually takes a minute or two.
              </EmptyState>
            )}

            {currentState === 'error' && (
              <ErrorState
                compact
                title="We couldn’t load the latest readings"
                onRetry={retryReadings}
              />
            )}

            {/* Quiet for over an hour: the API sends zeros, so say so instead. */}
            {currentState === 'ready' && current && !hasRecentReadings(current) && (
              <div className="space-y-2">
                <EmptyState
                  title="No readings in the last hour"
                  className="py-10"
                >
                  Your monitor last checked in {shortAgo(current.last_seen)}. Once it’s back online,
                  its readings show up here.
                </EmptyState>
                <DeviceFacts
                  current={current}
                  device={device}
                />
              </div>
            )}

            {currentState === 'ready' && hasRecentReadings(current) && (
              <div className="space-y-6">
                <MonitorReadings
                  current={current}
                  device={device}
                />

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
              <div
                className="h-[280px]"
                aria-busy="true"
              >
                <span className="sr-only">Loading history…</span>
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            )}

            {historyState === 'error' && (
              <ErrorState
                compact
                className="h-[280px]"
                title="We couldn’t load the history"
                onRetry={retryReadings}
              >
                Try another range, or come back in a moment.
              </ErrorState>
            )}

            {historyState === 'ready' && points.length === 0 && (
              <EmptyState
                illustration={false}
                className="h-[280px]"
                title="Nothing recorded in this range yet"
              >
                Try a shorter range, or check back once your monitor has been online a while.
              </EmptyState>
            )}

            {historyState === 'ready' && points.length > 0 && (
              <HistoryChart
                points={points}
                metricKey={metricKey}
                timeline={timeline}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  )
}
