import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { IndoorIcon, OutdoorIcon, PrivateIcon, PublicIcon } from '@/components/icons.g'
import { MonitorCard } from '@/components/MonitorCard'
import { useApi } from '@/lib/api'

// deviceFlags describes a device's visibility and placement: icon, label, and
// a short description (shown inline on the device page, as a tooltip elsewhere).
export function deviceFlags(device) {
  return [
    device.is_public
      ? { icon: PublicIcon, label: 'Public', description: 'Readings are shared publicly' }
      : { icon: PrivateIcon, label: 'Private', description: 'Readings are visible only to you' },
    device.is_outdoor
      ? { icon: OutdoorIcon, label: 'Outdoor', description: 'Sensor is installed outdoors' }
      : { icon: IndoorIcon, label: 'Indoor', description: 'Sensor is installed indoors' },
  ]
}

// DeviceFlags renders the flags as labeled badges; hover shows the description.
export function DeviceFlags({ device, className }) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {deviceFlags(device).map(({ icon: Icon, label, description }) => (
        <Badge
          key={label}
          variant="outline"
          title={description}
          className={className}
        >
          <Icon /> {label}
        </Badge>
      ))}
    </div>
  )
}

// DeviceCard loads a device's latest reading and shows it as a MonitorCard.
export function DeviceCard({ device }) {
  const { getDeviceCurrent } = useApi()
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
  }, [device.id, getDeviceCurrent])

  return (
    <MonitorCard
      device={device}
      current={current}
      loading={state === 'loading'}
      unavailable={state === 'error'}
      onOpen={() => navigate(`/app/devices/${device.id}`)}
    />
  )
}
