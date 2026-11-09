import { useCallback, useEffect, useState } from 'react'

import { AppShell } from '@/components/AppShell'
import { DeviceCard } from '@/components/DeviceCard'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { useApi } from '@/lib/api'

export function Dashboard() {
  const { listDevices } = useApi()
  const [devices, setDevices] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const loadDevices = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const data = await listDevices()
      setDevices(data)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [listDevices])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  return (
    <AppShell
      title="My monitors"
      subtitle="Your air monitors at a glance"
    >
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {status === 'loading' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="p-5 surface-raised"
              >
                <LoadingState label="Loading your devices" />
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="surface-raised">
            <ErrorState
              title="We couldn’t load your devices"
              onRetry={loadDevices}
              detail={error}
            >
              Our server didn’t answer this time. It’s usually brief, so give it another try.
            </ErrorState>
          </div>
        )}

        {status === 'ready' && devices.length === 0 && (
          <div className="surface-raised">
            <EmptyState title="No devices yet">
              Add your first monitor from the Open AIQ mobile app. It pairs over Bluetooth and sets
              everything up for you. Your monitor shows up here once it’s online.
            </EmptyState>
          </div>
        )}

        {status === 'ready' && devices.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
              />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  )
}
