import { useCallback, useEffect, useState } from 'react'
import { Loader2, ServerCrash, Inbox } from 'lucide-react'

import { DeviceCard } from '@/components/DeviceCard'
import { RegisterDeviceDialog } from '@/components/RegisterDeviceDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { listDevices } from '@/lib/api'

export function Dashboard() {
  const [devices, setDevices] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null)

  const loadDevices = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await listDevices()
      setDevices(data)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
            <p className="text-sm text-muted-foreground">
              Manage your registered air quality sensors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <RegisterDeviceDialog onRegistered={loadDevices} />
          </div>
        </header>

        <main className="mt-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Loading devices…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-24 text-center">
              <ServerCrash className="size-8 text-muted-foreground" />
              <p className="font-medium">Couldn’t load devices</p>
              <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {status === 'ready' && devices.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-24 text-center">
              <Inbox className="size-8 text-muted-foreground" />
              <p className="font-medium">No devices yet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Register your first device to start monitoring air quality.
              </p>
            </div>
          )}

          {status === 'ready' && devices.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
