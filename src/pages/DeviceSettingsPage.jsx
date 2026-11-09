import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, MapPin, Trash2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

import { AppShell } from '@/components/AppShell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { EmptyState, LoadingState } from '@/components/states'
import { useApi } from '@/lib/api'

export function DeviceSettingsPage() {
  const { deleteDevice, listDevices, updateDevice } = useApi()
  const { id } = useParams()
  const navigate = useNavigate()

  const [device, setDevice] = useState(null)
  const [state, setState] = useState('loading') // 'loading' | 'ready' | 'error'
  const [name, setName] = useState('')
  const [isOutdoor, setIsOutdoor] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [isLocationPublic, setIsLocationPublic] = useState(false)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [nameError, setNameError] = useState('')

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
      setIsLocationPublic(found.is_location_public)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [id, listDevices])

  useEffect(() => {
    loadDevice()
  }, [loadDevice])

  async function handleSave(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setNameError('')
    setSaving(true)
    try {
      const updated = await updateDevice(id, {
        name: trimmed,
        is_outdoor: isOutdoor,
        is_public: isPublic,
        is_location_public: isPublic && isLocationPublic,
      })
      setDevice(updated)
      toast.success('Settings saved')
    } catch (err) {
      const violation = err.fieldError?.('body', 'name')
      if (violation) setNameError(violation.detail)
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(e) {
    e.preventDefault()
    if (deleteConfirmation !== device.name) return

    setDeleting(true)
    try {
      await deleteDevice(id)
      toast.success(`Deleted "${device.name}"`)
      navigate('/app')
    } catch (err) {
      toast.error(err.message)
      setDeleting(false)
    }
  }

  function handleDeleteDialogChange(open) {
    if (deleting) return
    setDeleteDialogOpen(open)
    if (!open) setDeleteConfirmation('')
  }

  if (state === 'loading') {
    return (
      <AppShell
        backTo={`/app/devices/${id}`}
        backLabel="Back to the device"
        title="Device settings"
      >
        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="p-5 surface-raised">
            <LoadingState label="Loading device settings" />
          </div>
        </main>
      </AppShell>
    )
  }

  if (state === 'error') {
    return (
      <AppShell
        backTo="/app"
        backLabel="Back to my monitors"
        title="Device settings"
      >
        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="surface-raised">
            <EmptyState
              title="We couldn’t find this device"
              action={
                <Link
                  to="/app"
                  className={buttonVariants({ variant: 'outline' })}
                >
                  Back to your devices
                </Link>
              }
            >
              It may have been removed, or the link is out of date.
            </EmptyState>
          </div>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell
      backTo={`/app/devices/${id}`}
      backLabel={`Back to ${device.name}`}
      title="Device settings"
      subtitle={
        <>
          {device.name} · <span className="font-mono">{device.device_id}</span>
        </>
      }
    >
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <main className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Name and visibility of this device.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSave}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="device-name">Name</Label>
                  <Input
                    id="device-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setNameError('')
                    }}
                    maxLength={100}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? 'device-name-error' : undefined}
                    placeholder="Living Room Sensor"
                  />
                  {nameError && (
                    <p
                      id="device-name-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {nameError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="device-outdoor">Outdoor device</Label>
                    <p className="text-sm text-muted-foreground">
                      The sensor is installed outdoors.
                    </p>
                  </div>
                  <Switch
                    id="device-outdoor"
                    checked={isOutdoor}
                    onCheckedChange={setIsOutdoor}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="device-public">Public device</Label>
                    <p className="text-sm text-muted-foreground">
                      Share this device’s readings publicly.
                    </p>
                  </div>
                  <Switch
                    id="device-public"
                    checked={isPublic}
                    onCheckedChange={(checked) => {
                      setIsPublic(checked)
                      if (!checked) {
                        setIsLocationPublic(false)
                        setLocationDialogOpen(false)
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-highlight/50 bg-highlight/10 p-4">
                  <div>
                    <Label htmlFor="device-location-public">Share exact location</Label>
                    <p className="text-sm text-muted-foreground">
                      Publishes the latest precise telemetry coordinates on the community map.
                      Anyone can download them.
                    </p>
                  </div>
                  <Switch
                    id="device-location-public"
                    checked={isLocationPublic}
                    disabled={!isPublic}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setLocationDialogOpen(true)
                      } else {
                        setIsLocationPublic(false)
                      }
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving || !name.trim()}
                >
                  {saving && <Loader2 className="size-4 animate-spin" />} Save changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Device key</CardTitle>
              <CardDescription>
                Need a new key? Open this monitor in the Open AIQ mobile app. It replaces the key
                and sends it straight to the monitor over Bluetooth, so the secret never leaves your
                phone.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>
                Deleting a device removes it permanently. Its readings stop being accepted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete device
              </Button>
            </CardContent>
          </Card>
        </main>

        <Dialog
          open={locationDialogOpen}
          onOpenChange={setLocationDialogOpen}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex size-10 items-center justify-center rounded-full bg-highlight/20 text-primary">
                <MapPin className="size-5" />
              </div>
              <DialogTitle>Share this device’s exact location?</DialogTitle>
              <DialogDescription>
                The latest precise coordinates reported by {device.name} will be publicly visible on
                the community map.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-highlight/50 bg-highlight/10 p-3 text-sm text-muted-foreground">
              Anyone can view and download this location data. Only enable this setting if the
              device owner and people at its location have agreed to share it publicly.
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocationDialogOpen(false)}
              >
                Keep location private
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsLocationPublic(true)
                  setLocationDialogOpen(false)
                }}
              >
                <MapPin className="size-4" />
                Share exact location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
        >
          <DialogContent
            className="sm:max-w-lg"
            showCloseButton={!deleting}
          >
            <DialogHeader>
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <TriangleAlert className="size-5" />
              </div>
              <DialogTitle>Delete {device.name} permanently?</DialogTitle>
              <DialogDescription>
                This action permanently deletes the device and all of its sensor data. Open AIQ does
                not currently support soft deletion or recovery.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-destructive">The following will be deleted:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>The device registration and settings</li>
                <li>All historical air-quality, climate, and location readings</li>
              </ul>
            </div>

            <form
              id="delete-device-form"
              onSubmit={handleDelete}
              className="space-y-2"
            >
              <Label htmlFor="delete-device-confirmation">
                Type <span className="font-mono font-semibold text-foreground">{device.name}</span>{' '}
                to confirm
              </Label>
              <Input
                id="delete-device-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                disabled={deleting}
                autoComplete="off"
                autoFocus
              />
            </form>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteDialogChange(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="delete-device-form"
                variant="destructive"
                disabled={deleting || deleteConfirmation !== device.name}
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete device and data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
