import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Settings } from 'lucide-react'

import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HistoryChart } from '@/components/HistoryChart'
import { MonitorReadings } from '@/components/readings'
import { EmptyState, ErrorState } from '@/components/states'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/lib/api'

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
  }, [id, listDevices])

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
  }, [getDeviceCurrent, id])

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
  }, [getDeviceHistorical, id, timeline])

  return (
    <AppShell
      backTo="/app"
      backLabel="Back to my monitors"
      title={
        deviceState === 'ready' && device ? (
          device.name
        ) : deviceState === 'error' ? (
          'We couldn’t find this device'
        ) : (
          <span className="text-muted-foreground">Loading device…</span>
        )
      }
      subtitle={
        deviceState === 'error' ? 'It may have been removed, or the link is out of date.' : null
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
              >
                It’s usually a brief hiccup. Refresh the page in a moment.
              </ErrorState>
            )}

            {currentState === 'ready' && current && (
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
