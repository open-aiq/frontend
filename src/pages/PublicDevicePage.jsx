import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CloudOff, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { HistoryChart } from '@/components/HistoryChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicDeviceCurrent, getPublicDeviceHistorical, listPublicDevices } from '@/lib/api'
import { aqiInfo } from '@/lib/aqi'

export function PublicDevicePage() {
  const { id } = useParams(); const [device, setDevice] = useState(null); const [current, setCurrent] = useState(null); const [points, setPoints] = useState([]); const [state, setState] = useState('loading')
  useEffect(() => { Promise.all([listPublicDevices(), getPublicDeviceCurrent(id), getPublicDeviceHistorical(id, 'daily')]).then(([devices, now, history]) => { setDevice(devices.find((d) => d.id === id)); setCurrent(now); setPoints(history); setState('ready') }).catch(() => setState('error')) }, [id])
  const info = current ? aqiInfo(current.aqi) : null
  return <div className="min-h-screen bg-muted/30"><div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
    <PageHeader title={device?.name ?? 'Public device'} description={device ? `${device.is_outdoor ? 'Outdoor' : 'Indoor'} public sensor` : undefined} />
    <main className="mt-8 space-y-6">{state === 'loading' && <div className="flex justify-center py-24"><Loader2 className="animate-spin" /></div>}{state === 'error' && <div className="flex justify-center gap-2 py-24"><CloudOff /> Device not found or has no readings.</div>}{state === 'ready' && <><Card><CardHeader><CardTitle>Current</CardTitle></CardHeader><CardContent><div className="w-fit rounded-2xl px-5 py-4" style={{backgroundColor:info.bg,color:info.fg}}><div className="text-6xl font-semibold">{current.aqi}</div><div>US AQI · {info.label}</div></div><p className="mt-4 text-sm text-muted-foreground">PM2.5 {current.pm2_5.toFixed(1)} µg/m³ · {current.temperature.toFixed(1)}°C · {current.humidity.toFixed(0)}% humidity</p></CardContent></Card><Card><CardHeader><CardTitle>Last 24 hours</CardTitle></CardHeader><CardContent>{points.length ? <HistoryChart points={points} metricKey="aqi" /> : <p className="py-16 text-center text-muted-foreground">No data for this range.</p>}</CardContent></Card></>}</main>
  </div></div>
}
