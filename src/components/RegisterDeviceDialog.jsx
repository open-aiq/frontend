import { useState } from 'react'
import { Copy, Loader2, Plus } from 'lucide-react'
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
import { registerDevice } from '@/lib/api'

export function RegisterDeviceDialog({ onRegistered }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  function resetAndClose() {
    setOpen(false)
    // Delay the reset so it doesn't flash while the dialog animates out.
    setTimeout(() => {
      setName('')
      setCreated(null)
      setSubmitting(false)
    }, 200)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setSubmitting(true)
    try {
      const device = await registerDevice(trimmed)
      setCreated(device)
      onRegistered?.()
      toast.success(`Registered "${device.name}"`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(created.device_key)
    toast.success('Device key copied to clipboard')
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}>
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
                <code className="rounded-md bg-muted px-3 py-2 text-sm break-all">
                  {created.device_id}
                </code>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-muted-foreground">Device key</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm break-all">
                    {created.device_key}
                  </code>
                  <Button type="button" size="icon" variant="outline" onClick={copyKey}>
                    <Copy className="size-4" />
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
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting || !name.trim()}>
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
