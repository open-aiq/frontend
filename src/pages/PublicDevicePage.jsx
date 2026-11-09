import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'

import { PublicHeader } from '@/components/PublicHeader'
import { HistoryChart } from '@/components/HistoryChart'
import { DeviceFacts } from '@/components/DeviceFacts'
import { AqiTile, MetricGroups } from '@/components/readings'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicDevice, getPublicDeviceCurrent, getPublicDeviceHistorical } from '@/lib/api'

export function PublicDevicePage() {
  const { id } = useParams()
  const [device, setDevice] = useState(null)
  const [current, setCurrent] = useState(null)
  const [points, setPoints] = useState([])
  const [deviceState, setDeviceState] = useState('loading')
  const [readingState, setReadingState] = useState('loading')

  useEffect(() => {
    let active = true
    getPublicDevice(id)
      .then((data) => {
        if (active) {
          setDevice(data)
          setDeviceState('ready')
        }
      })
      .catch(() => {
        if (active) setDeviceState('error')
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
        if (active) setReadingState(error.status === 404 ? 'nodata' : 'error')
      })
    return () => {
      active = false
    }
  }, [id])

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
                  <ErrorState title="We couldn’t load the readings">
                    It’s usually a brief hiccup. Refresh the page in a moment.
                  </ErrorState>
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
                      <div className="grid gap-4 md:grid-cols-2 md:items-start">
                        <div className="grid gap-3">
                          <AqiTile
                            aqi={current.aqi}
                            caption="Averages over the last hour"
                          />
                          <DeviceFacts
                            current={current}
                            placement={device}
                          />
                        </div>
                        <MetricGroups current={current} />
                      </div>
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
