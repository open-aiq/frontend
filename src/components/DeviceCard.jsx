import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloudOff, Globe, House, Lock, ServerCrash, TreePine } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getDeviceCurrent } from '@/lib/api'
import { aqiInfo } from '@/lib/aqi'
import { cn } from '@/lib/utils'

// StatusBadge shows online/offline; the dot color is backed by the text label.
export function StatusBadge({ status, className }) {
  const online = status === 'online'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        online ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', online ? 'bg-emerald-500' : 'bg-current opacity-50')} />
      {online ? 'Online' : 'Offline'}
    </span>
  )
}

// deviceFlags describes a device's visibility and placement: icon, label, and
// a short description (shown inline on the device page, as a tooltip elsewhere).
export function deviceFlags(device) {
  return [
    device.is_public
      ? { icon: Globe, label: 'Public', description: 'Readings are shared publicly' }
      : { icon: Lock, label: 'Private', description: 'Readings are visible only to you' },
    device.is_outdoor
      ? { icon: TreePine, label: 'Outdoor', description: 'Sensor is installed outdoors' }
      : { icon: House, label: 'Indoor', description: 'Sensor is installed indoors' },
  ]
}

// DeviceFlags renders the flags as labeled badges; hover shows the description.
export function DeviceFlags({ device, className }) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {deviceFlags(device).map(({ icon: Icon, label, description }) => (
        <Badge key={label} variant="outline" title={description} className={className}>
          <Icon /> {label}
        </Badge>
      ))}
    </div>
  )
}

export function DeviceCard({ device }) {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(null)
  const [state, setState] = useState('loading') // 'loading' | 'ready' | 'nodata' | 'error'

  useEffect(() => {
    let cancelled = false
    getDeviceCurrent(device.id)
      .then((data) => {
        if (cancelled) return
        setCurrent(data)
        setState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setState(err.status === 404 ? 'nodata' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [device.id])

  const aqi = current ? aqiInfo(current.aqi) : null
  // Once data is in, the whole card wears the AQI band color (AirVisual style).
  const colored = state === 'ready' && aqi

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/devices/${device.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/devices/${device.id}`)
      }}
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring',
        colored && 'border-transparent',
      )}
      style={colored ? { backgroundColor: aqi.bg, color: aqi.fg } : undefined}
      aria-label={`Open ${device.name}`}
    >
      <CardHeader>
        <CardTitle>{device.name}</CardTitle>
        <CardAction>
          <DeviceFlags device={device} className={colored ? 'border-current/25 text-current' : undefined} />
        </CardAction>
      </CardHeader>

      <CardContent>
        {state === 'loading' && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}

        {state === 'nodata' && (
          <div className="flex items-center gap-3 py-4 text-muted-foreground">
            <CloudOff className="size-5" />
            <p className="text-sm">No data yet — waiting for the first reading.</p>
          </div>
        )}

        {state === 'error' && (
          <div className="flex items-center gap-3 py-4 text-muted-foreground">
            <ServerCrash className="size-5" />
            <p className="text-sm">Couldn’t load readings.</p>
          </div>
        )}

        {state === 'ready' && current && (
          <div className="space-y-3">
            <StatusBadge status={current.status} className="text-current" />

            <div>
              <div className="text-5xl leading-none font-semibold">{current.aqi}</div>
              <div className="mt-1 text-sm font-medium">US AQI · {aqi.label}</div>
            </div>

            <p className="text-base">
              <span className="opacity-75">PM2.5</span>{' '}
              <span className="font-medium">{current.pm2_5.toFixed(1)}</span>{' '}
              <span className="text-xs opacity-75">µg/m³</span>
            </p>

            <p className="text-xs opacity-75">
              {current.temperature.toFixed(1)}°C · {current.humidity.toFixed(0)}% humidity ·{' '}
              feels {current.heat_index.toFixed(1)}°C
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
