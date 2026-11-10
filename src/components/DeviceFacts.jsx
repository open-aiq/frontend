import {
  IndoorIcon,
  OfflineIcon,
  OnlineIcon,
  OutdoorIcon,
  PrivateIcon,
  PublicIcon,
} from '@/components/icons.g'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// deviceFlags describes a device's visibility and placement: icon, label, and
// a short description.
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

// DeviceFacts is the row of bubbles under the readings inside a monitor, each
// with one word underneath: whether it's online, then (when `device` is given)
// whether its readings are shared and where it's installed. Pass `placement`
// alone for public pages, where sharing is a given. Hovering or focusing a
// bubble explains it; screen readers hear the word and the explanation. Pass
// `loading` with a `count` for placeholders while the reading loads.
export function DeviceFacts({ current, device, placement, loading = false, count = 3, className }) {
  if (loading) {
    return (
      <div
        className={cn('flex justify-center gap-6', className)}
        aria-hidden="true"
      >
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className="grid justify-items-center gap-1.5"
          >
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-3 w-12 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  const online = current?.status === 'online'
  const facts = [
    {
      icon: online ? OnlineIcon : OfflineIcon,
      label: online ? 'Online' : 'Offline',
      description: formatLastSeen(current?.last_seen),
      tone: online ? 'text-online' : undefined,
    },
  ]
  if (device) facts.push(...deviceFlags(device))
  else if (placement) facts.push(...deviceFlags(placement).slice(1))

  return (
    <ul
      aria-label="About this monitor"
      className={cn('flex flex-wrap justify-center gap-6', className)}
    >
      {facts.map(({ icon: Icon, label, description, tone }) => (
        <li key={label}>
          <Tooltip>
            <TooltipTrigger
              aria-label={`${label}. ${description}`}
              className="group grid justify-items-center gap-1.5 rounded-2xl px-1.5 py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  'grid size-10 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors group-hover:bg-secondary/80',
                  tone,
                )}
              >
                <Icon className="size-5" />
              </span>
              <span
                className={cn('text-xs', tone ? `font-medium ${tone}` : 'text-muted-foreground')}
              >
                {label}
              </span>
            </TooltipTrigger>
            <TooltipContent>{description}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  )
}
