import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, KeyRound, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ThemeToggle } from '@/components/ThemeToggle'
import { deleteDevice, listDevices, rotateDeviceKey, updateDevice } from '@/lib/api'

export function DeviceSettingsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [device, setDevice] = useState(null)
  const [state, setState] = useState('loading') // 'loading' | 'ready' | 'error'
  const [name, setName] = useState('')
  const [isOutdoor, setIsOutdoor] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [rotatedKey, setRotatedKey] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // There is no GET /devices/{id}; resolve the device from the list.
  const loadDevice = useCallback(async () => {
    setState('loading')
    try {
      const devices = await listDevices()
      const found = devices.find((d) => d.id === id)
      if (!found) {
        setState('error')
        return
      }
      setDevice(found)
      setName(found.name)
      setIsOutdoor(found.is_outdoor)
      setIsPublic(found.is_public)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [id])

  useEffect(() => {
    loadDevice()
  }, [loadDevice])

  async function handleSave(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setSaving(true)
    try {
      const updated = await updateDevice(id, {
        name: trimmed,
        is_outdoor: isOutdoor,
        is_public: isPublic,
      })
      setDevice(updated)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRotate() {
    const ok = window.confirm(
      'Rotate the device key? The current key stops working immediately and the device must be updated with the new one.',
    )
    if (!ok) return

    setRotating(true)
    try {
      const rotated = await rotateDeviceKey(id)
      setRotatedKey(rotated.device_key)
      toast.success('Device key rotated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRotating(false)
    }
  }

  async function handleCopyKey() {
    await navigator.clipboard.writeText(rotatedKey)
    toast.success('Key copied to clipboard')
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${device.name}"? This cannot be undone.`)) return

    setDeleting(true)
    try {
      await deleteDevice(id)
      toast.success(`Deleted "${device.name}"`)
      navigate('/')
    } catch (err) {
      toast.error(err.message)
      setDeleting(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30">
        <p className="font-medium">Device not found</p>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to devices
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link
              to={`/devices/${id}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> {device.name}
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Device settings</h1>
            <p className="font-mono text-xs text-muted-foreground">{device.device_id}</p>
          </div>
          <ThemeToggle />
        </header>

        <main className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Name and visibility of this device.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="device-name">Name</Label>
                  <Input
                    id="device-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Living Room Sensor"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="device-outdoor">Outdoor device</Label>
                    <p className="text-sm text-muted-foreground">
                      The sensor is installed outdoors.
                    </p>
                  </div>
                  <Switch id="device-outdoor" checked={isOutdoor} onCheckedChange={setIsOutdoor} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="device-public">Public device</Label>
                    <p className="text-sm text-muted-foreground">
                      Share this device’s readings publicly.
                    </p>
                  </div>
                  <Switch id="device-public" checked={isPublic} onCheckedChange={setIsPublic} />
                </div>

                <Button type="submit" disabled={saving || !name.trim()}>
                  {saving && <Loader2 className="size-4 animate-spin" />} Save changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Device key</CardTitle>
              <CardDescription>
                Rotate the secret key if it was exposed. The old key stops working immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rotatedKey && (
                <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
                  <p className="text-sm font-medium">
                    New key — store it now, it won’t be shown again:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all rounded bg-background px-2 py-1 font-mono text-xs">
                      {rotatedKey}
                    </code>
                    <Button size="icon" variant="ghost" onClick={handleCopyKey} aria-label="Copy key">
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
              <Button variant="outline" onClick={handleRotate} disabled={rotating}>
                {rotating ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                Rotate key
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>
                Deleting a device removes it permanently. Its readings stop being accepted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete device
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
