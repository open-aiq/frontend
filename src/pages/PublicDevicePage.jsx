import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CloudOff, Loader2, MapPin, ServerCrash } from 'lucide-react'

import { PublicHeader } from '@/components/PublicHeader'
import { HistoryChart } from '@/components/HistoryChart'
import { StatusBadge } from '@/components/DeviceCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicDevice, getPublicDeviceCurrent, getPublicDeviceHistorical } from '@/lib/api'
import { aqiInfo } from '@/lib/aqi'

function formattedDate(value) {
  return value ? new Date(value).toLocaleString() : 'Unknown'
}

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
      .then((data) => { if (active) { setDevice(data); setDeviceState('ready') } })
      .catch(() => { if (active) setDeviceState('error') })
    Promise.all([getPublicDeviceCurrent(id), getPublicDeviceHistorical(id, 'daily')])
      .then(([now, history]) => { if (active) { setCurrent(now); setPoints(history); setReadingState('ready') } })
      .catch((error) => { if (active) setReadingState(error.status === 404 ? 'nodata' : 'error') })
    return () => { active = false }
  }, [id])

  const info = current ? aqiInfo(current.aqi) : null
  return (
    <div className="min-h-screen bg-muted/30">
      <PublicHeader />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/map" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Community map</Link>
        {deviceState === 'loading' && <div className="flex justify-center py-24"><Loader2 className="animate-spin" /></div>}
        {deviceState === 'error' && <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed py-24"><ServerCrash /><p className="font-medium">Public device not found</p></div>}
        {deviceState === 'ready' && device && <>
          <header className="mt-4"><h1 className="text-3xl font-semibold tracking-tight">{device.name}</h1><p className="mt-1 text-muted-foreground">{device.is_outdoor ? 'Outdoor' : 'Indoor'} community sensor</p></header>
          <main className="mt-8 space-y-6">
            {readingState === 'loading' && <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>}
            {readingState === 'nodata' && <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-20 text-muted-foreground"><CloudOff /> This device has not shared a reading yet.</div>}
            {readingState === 'error' && <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-20 text-muted-foreground"><ServerCrash /> Couldn’t load readings.</div>}
            {readingState === 'ready' && current && <>
              <Card><CardHeader><CardTitle>Current</CardTitle><CardDescription>Averages over the last hour</CardDescription></CardHeader><CardContent>
                <div className="mb-5 flex items-center gap-4"><StatusBadge status={current.status} /><span className="text-xs text-muted-foreground">Last seen {formattedDate(current.last_seen)}</span></div>
                <div className="flex flex-wrap items-end gap-8"><div className="w-fit rounded-2xl px-5 py-4" style={{ backgroundColor: info.bg, color: info.fg }}><div className="text-6xl font-semibold">{current.aqi}</div><div>US AQI · {info.label}</div></div><div className="space-y-2 text-sm"><p>PM2.5 <strong>{current.pm2_5.toFixed(1)}</strong> µg/m³</p><p>Temperature <strong>{current.temperature.toFixed(1)}</strong>°C</p><p>Humidity <strong>{current.humidity.toFixed(0)}</strong>%</p></div></div>
                {current.location && <Link to={`/map?device=${id}`} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"><MapPin className="size-4" /> View exact shared location on map</Link>}
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Last 24 hours</CardTitle></CardHeader><CardContent>{points.length ? <HistoryChart points={points} metricKey="aqi" /> : <p className="py-16 text-center text-muted-foreground">No data for this range.</p>}</CardContent></Card>
            </>}
          </main>
        </>}
      </div>
    </div>
  )
}
