import { useCallback, useEffect, useState } from 'react'
import { Inbox, Loader2, ServerCrash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DeviceCard } from '@/components/DeviceCard'
import { RegisterDeviceDialog } from '@/components/RegisterDeviceDialog'
import { PageHeader } from '@/components/PageHeader'
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
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader title="Dashboard" description="Manage your registered air quality sensors." showDashboard={false} />

        <main className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Your devices</h2>
            <RegisterDeviceDialog onRegistered={loadDevices} />
          </div>
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Loading devices…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-24 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-destructive/10"><ServerCrash className="size-7 text-destructive" /></span>
              <p className="font-medium">Devices are temporarily unavailable</p>
              <p className="max-w-md text-sm text-muted-foreground">We couldn’t reach the Open AIQ backend. Check that it is running, then try again.</p>
              <Button variant="outline" onClick={loadDevices}>Try again</Button>
              <span className="sr-only">Technical error: {error}</span>
            </div>
          )}

          {status === 'ready' && devices.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-24 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-muted"><Inbox className="size-7 text-muted-foreground" /></span>
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
