import { useState } from 'react'
import { Copy, Eye, EyeOff, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApi } from '@/lib/api'

export function RegisterDeviceDialog({ onRegistered }) {
  const { registerDevice } = useApi()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)
  const [showKey, setShowKey] = useState(false)
  const [nameError, setNameError] = useState('')

  function resetAndClose() {
    setOpen(false)
    // Delay the reset so it doesn't flash while the dialog animates out.
    setTimeout(() => {
      setName('')
      setCreated(null)
      setShowKey(false)
      setSubmitting(false)
      setNameError('')
    }, 200)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setNameError('')
    setSubmitting(true)
    try {
      const device = await registerDevice(trimmed)
      setCreated(device)
      onRegistered?.()
      toast.success(`Registered "${device.name}"`)
    } catch (err) {
      const violation = err.fieldError?.('body', 'name')
      if (violation) setNameError(violation.detail)
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function copyValue(value, label) {
    navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Register device
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Device registered</DialogTitle>
              <DialogDescription>
                Copy the device key now — it is shown only once and cannot be retrieved later.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label className="text-muted-foreground">Device ID</Label>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 text-sm break-all">
                    {created.device_id}
                  </code>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => copyValue(created.device_id, 'Device ID')}
                    title="Copy device ID"
                    aria-label="Copy device ID"
                  >
                    <Copy />
                  </Button>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-muted-foreground">Device key</Label>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 text-sm break-all">
                    {showKey
                      ? created.device_key
                      : '•'.repeat(Math.min(created.device_key.length, 32))}
                  </code>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setShowKey((visible) => !visible)}
                    title={showKey ? 'Hide device key' : 'Show device key'}
                    aria-label={showKey ? 'Hide device key' : 'Show device key'}
                  >
                    {showKey ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => copyValue(created.device_key, 'Device key')}
                    title="Copy device key"
                    aria-label="Copy device key"
                  >
                    <Copy />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={resetAndClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Register a new device</DialogTitle>
              <DialogDescription>Give the device a name to register it.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-2 py-4">
              <Label htmlFor="device-name">Device name</Label>
              <Input
                id="device-name"
                placeholder="Living Room Sensor"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setNameError('')
                }}
                maxLength={100}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? 'device-name-error' : undefined}
                autoFocus
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

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={submitting || !name.trim()}
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Register
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
