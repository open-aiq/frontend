import { OfflineIcon, OnlineIcon } from '@/components/icons.g'
import { deviceFlags } from '@/components/DeviceCard'
import { cn } from '@/lib/utils'

function formatLastSeen(value) {
  if (!value) return 'Not seen yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not seen yet'
  return `Last seen ${date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

// DeviceFacts sits under the AQI tile inside a monitor: whether it's online
// and when we last heard from it, then (when `device` is given) whether its
// readings are shared and where it's installed. Pass `placement` alone for
// public pages, where sharing is a given.
export function DeviceFacts({ current, device, placement, className }) {
  const online = current?.status === 'online'
  const rows = [
    {
      icon: online ? OnlineIcon : OfflineIcon,
      label: online ? 'Online' : 'Offline',
      description: formatLastSeen(current?.last_seen),
      tone: online ? 'text-online' : 'text-muted-foreground',
    },
  ]
  if (device) rows.push(...deviceFlags(device))
  else if (placement) rows.push(...deviceFlags(placement).slice(1))

  return (
    <ul
      className={cn(
        'divide-y divide-border rounded-[1.25rem] border bg-card px-4 text-card-foreground',
        className,
      )}
    >
      {rows.map(({ icon: Icon, label, description, tone }) => (
        <li
          key={label}
          className="flex items-center gap-3 py-3"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <Icon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className={cn('block font-medium', tone)}>{label}</span>
            <span className="block text-xs text-muted-foreground">{description}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
