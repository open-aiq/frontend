import {
  IndoorIcon,
  OfflineIcon,
  OnlineIcon,
  OutdoorIcon,
  Pm25Icon,
  TemperatureIcon,
  UpdateIcon,
} from '@/components/icons.g'
import { AqiBlock } from '@/components/readings'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, shortAgo } from '@/lib/format'
import { cn } from '@/lib/utils'

function Stat({ icon: Icon, label, value, unit, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-9 rounded-full" />
        <div className="grid gap-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-8 text-sage" />
      <div>
        <p className="leading-tight">
          <span className="font-semibold tabular-nums">{value}</span>{' '}
          <span className="text-xs text-muted-foreground">{unit}</span>
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function StatusLine({ online, seen, unavailable }) {
  const Icon = online ? OnlineIcon : OfflineIcon
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon
        className={cn('size-4', online ? 'text-sage' : 'text-wood')}
        title={online ? 'Online' : 'Offline'}
      />
      {unavailable ? 'Unavailable' : shortAgo(seen)}
    </span>
  )
}

// MonitorCard is the monitor card from the visual playground, matching the
// app's MonitorCard (app/lib/widgets/monitor_card.dart): icon, name and status,
// then the AQI block with temperature and PM2.5. It draws only what it's
// given; DeviceCard does the fetching.
//
// `current` is the API's current reading, or null when there's none yet.
export function MonitorCard({
  device,
  current = null,
  loading = false,
  unavailable = false,
  onOpen,
  className,
}) {
  const hasData = !loading && current != null
  const update = device.ota?.status === 'update_available'
  const open = onOpen
    ? {
        role: 'button',
        tabIndex: 0,
        onClick: onOpen,
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onOpen()
          }
        },
        'aria-label': `Open ${device.name}`,
      }
    : {}
  const KindIcon = device.is_outdoor ? OutdoorIcon : IndoorIcon

  return (
    <article
      {...open}
      className={cn(
        'p-5 surface-raised',
        onOpen &&
          'cursor-pointer surface-lift focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className,
      )}
    >
      <header className="mb-4.5 flex items-center gap-2.5">
        <KindIcon
          className="size-5.5 text-sage"
          title={device.is_outdoor ? 'Outdoor' : 'Indoor'}
        />
        <h3 className="min-w-0 flex-1 truncate font-semibold">{device.name}</h3>
        {loading ? (
          <Skeleton className="h-3.5 w-16" />
        ) : (
          <StatusLine
            online={current?.status === 'online'}
            seen={current?.last_seen}
            unavailable={unavailable}
          />
        )}
        {update && !loading && (
          <span
            className="grid size-6.5 place-items-center rounded-full bg-highlight/30 text-primary"
            title="An update is available"
          >
            <UpdateIcon className="size-3.5" />
            <span className="sr-only">An update is available</span>
          </span>
        )}
      </header>
      <div className="grid grid-cols-[5fr_4fr] items-center gap-4.5">
        <AqiBlock
          aqi={hasData ? current.aqi : null}
          loading={loading}
        />
        <div className="grid gap-5">
          <Stat
            icon={TemperatureIcon}
            label="Temperature"
            value={hasData ? formatNumber(current.temperature) : '--'}
            unit="°C"
            loading={loading}
          />
          <Stat
            icon={Pm25Icon}
            label="PM2.5"
            value={hasData ? formatNumber(current.pm2_5) : '--'}
            unit="µg/m³"
            loading={loading}
          />
        </div>
      </div>
    </article>
  )
}
