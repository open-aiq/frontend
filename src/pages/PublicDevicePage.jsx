import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'

import { PublicHeader } from '@/components/PublicHeader'
import { HistoryChart } from '@/components/HistoryChart'
import { DeviceFacts } from '@/components/DeviceFacts'
import { MonitorReadings } from '@/components/readings'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicDevice, getPublicDeviceCurrent, getPublicDeviceHistorical } from '@/lib/api'
import { shortAgo } from '@/lib/format'
import { hasRecentReadings } from '@/lib/readings'
import { errorKind } from '@/lib/errors'

export function PublicDevicePage() {
  const { id } = useParams()
  const [device, setDevice] = useState(null)
  const [current, setCurrent] = useState(null)
  const [points, setPoints] = useState([])
  const [deviceState, setDeviceState] = useState('loading') // 'loading' | 'ready' | 'missing' | 'error'
  const [readingState, setReadingState] = useState('loading') // 'loading' | 'ready' | 'nodata' | 'error'
  // Bumping this fetches everything again after a failure.
  const [reloadKey, setReloadKey] = useState(0)
  const retry = () => setReloadKey((key) => key + 1)

  useEffect(() => {
    let active = true
    setDeviceState('loading')
    setReadingState('loading')
    getPublicDevice(id)
      .then((data) => {
        if (active) {
          setDevice(data)
          setDeviceState('ready')
        }
      })
      .catch((error) => {
        // Only a not-found answer means the sensor is gone or private. A
        // dropped connection or a server error is worth another try.
        if (active) setDeviceState(errorKind(error) === 'not-found' ? 'missing' : 'error')
      })
    Promise.all([getPublicDeviceCurrent(id), getPublicDeviceHistorical(id, 'daily')])
      .then(([now, history]) => {
        if (active) {
          setCurrent(now)
          setPoints(history)
          setReadingState('ready')
        }
      })
      .catch((error) => {
        if (!active) return
        const kind = errorKind(error)
        if (kind === 'not-found') setDeviceState('missing')
        else setReadingState(kind === 'no-readings' ? 'nodata' : 'error')
      })
    return () => {
      active = false
    }
  }, [id, reloadKey])

  return (
    <div className="min-h-screen bg-background surface-glow">
      <PublicHeader />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/map"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Community map
        </Link>
        {deviceState === 'loading' && (
          <div className="mt-8 p-5 surface-raised">
            <LoadingState label="Loading this sensor" />
          </div>
        )}
        {deviceState === 'error' && (
          <div className="mt-8 surface-raised">
            <ErrorState
              title="We couldn’t load this sensor"
              onRetry={retry}
            />
          </div>
        )}
        {deviceState === 'missing' && (
          <div className="mt-8 surface-raised">
            <EmptyState title="We couldn’t find this sensor">
              Its owner may have stopped sharing it, or the link is out of date. You can find other
              sensors on the community map.
            </EmptyState>
          </div>
        )}
        {deviceState === 'ready' && device && (
          <>
            <header className="mt-4">
              <h1 className="text-3xl font-semibold tracking-tight">{device.name}</h1>
              <p className="mt-1 text-muted-foreground">
                {device.is_outdoor ? 'Outdoor' : 'Indoor'} community sensor
              </p>
            </header>
            <main className="mt-8 space-y-6">
              {readingState === 'loading' && (
                <div className="p-5 surface-raised">
                  <LoadingState
                    label="Loading readings"
                    lines={4}
                  />
                </div>
              )}
              {readingState === 'nodata' && (
                <div className="surface-raised">
                  <EmptyState title="No readings shared yet">
                    This sensor hasn’t shared a reading. Check back soon.
                  </EmptyState>
                </div>
              )}
              {readingState === 'error' && (
                <div className="surface-raised">
                  <ErrorState
                    title="We couldn’t load the readings"
                    onRetry={retry}
                  />
                </div>
              )}
              {readingState === 'ready' && current && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Current</CardTitle>
                      <CardDescription>Averages over the last hour</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hasRecentReadings(current) ? (
                        <MonitorReadings
                          current={current}
                          placement={device}
                        />
                      ) : (
                        <div className="space-y-2">
                          <EmptyState
                            title="No readings in the last hour"
                            className="py-10"
                          >
                            This sensor last checked in {shortAgo(current.last_seen)}. Once it’s
                            back online, its readings show up here.
                          </EmptyState>
                          <DeviceFacts
                            current={current}
                            placement={device}
                          />
                        </div>
                      )}
                      {current.location && (
                        <Link
                          to={`/map?device=${id}`}
                          className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          <MapPin className="size-4" /> See it on the map
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Last 24 hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {points.length ? (
                        <HistoryChart
                          points={points}
                          metricKey="aqi"
                          timeline="daily"
                        />
                      ) : (
                        <EmptyState
                          illustration={false}
                          title="Nothing recorded in the last day"
                        />
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  )
}
