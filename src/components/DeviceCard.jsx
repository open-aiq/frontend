import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { MonitorCard } from '@/components/MonitorCard'
import { useApi } from '@/lib/api'

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
